import { decrypt, encrypt } from '../encryption'
import { prisma } from '../prisma'

export class HostexTokenManager {
  /**
   * Get a valid access token for a connection, auto-refreshing if expired (OAuth).
   */
  async getValidToken(connectionId: string): Promise<string> {
    const connection = await prisma.hostexConnection.findUniqueOrThrow({
      where: { id: connectionId },
    })

    if (!connection.isActive) {
      throw new Error(`Connection ${connectionId} is inactive`)
    }

    // For simple token auth, just return the decrypted token
    if (connection.authMethod === 'token') {
      return decrypt(connection.accessToken)
    }

    // For OAuth, check token expiry and refresh if needed
    if (connection.tokenExpiresAt && connection.tokenExpiresAt < new Date()) {
      await this.refreshToken(connectionId)
      // Re-fetch after refresh
      const refreshed = await prisma.hostexConnection.findUniqueOrThrow({
        where: { id: connectionId },
      })
      return decrypt(refreshed.accessToken)
    }

    return decrypt(connection.accessToken)
  }

  /**
   * Refresh an OAuth token
   */
  async refreshToken(connectionId: string): Promise<void> {
    const connection = await prisma.hostexConnection.findUniqueOrThrow({
      where: { id: connectionId },
    })

    if (connection.authMethod !== 'oauth' || !connection.refreshToken) {
      throw new Error('Cannot refresh token for non-OAuth connection')
    }

    const refreshToken = decrypt(connection.refreshToken)
    const baseUrl = process.env.HOSTEX_API_BASE_URL || 'https://api.hostex.io/v3'

    const response = await fetch(`${baseUrl.replace('/v3', '')}/oauth/authorizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: process.env.HOSTEX_CLIENT_ID,
        client_secret: process.env.HOSTEX_CLIENT_SECRET,
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Token refresh failed: ${JSON.stringify(error)}`)
    }

    const data = (await response.json()) as {
      access_token: string
      refresh_token: string
      expires_in: number
    }

    await prisma.hostexConnection.update({
      where: { id: connectionId },
      data: {
        accessToken: encrypt(data.access_token),
        refreshToken: encrypt(data.refresh_token),
        tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
      },
    })
  }

  /**
   * Revoke an OAuth token (called on disconnect)
   */
  async revokeToken(connectionId: string): Promise<void> {
    const connection = await prisma.hostexConnection.findUniqueOrThrow({
      where: { id: connectionId },
    })

    if (connection.authMethod !== 'oauth') return

    const accessToken = decrypt(connection.accessToken)
    const baseUrl = process.env.HOSTEX_API_BASE_URL || 'https://api.hostex.io/v3'

    await fetch(`${baseUrl.replace('/v3', '')}/oauth/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: accessToken,
        client_id: process.env.HOSTEX_CLIENT_ID,
        client_secret: process.env.HOSTEX_CLIENT_SECRET,
      }),
    }).catch(() => {
      // Revocation failure is not critical
    })
  }
}

export const tokenManager = new HostexTokenManager()
