import { throttle, withRetry } from './rate-limiter'
import { decrypt } from '../encryption'
import { prisma } from '../prisma'
import type {
  ChannexARIUpdateRequest,
  ChannexAvailability,
  ChannexListResponse,
  ChannexMetaResponse,
  ChannexPropertyAttributes,
  ChannexPropertyInput,
  ChannexRatePlanAttributes,
  ChannexRatePlanInput,
  ChannexRestrictions,
  ChannexRoomTypeAttributes,
  ChannexRoomTypeInput,
  ChannexSingleResponse,
  ChannexWebhookAttributes,
  ChannexWebhookInput,
  ChannexBookingRevisionAttributes,
} from './types'

const CHANNEX_BASE_URL = 'https://app.channex.io/api/v1'
const CHANNEX_STAGING_URL = 'https://staging.channex.io/api/v1'

export class ChannexClient {
  private baseUrl: string
  private connectionId: string

  constructor(connectionId: string) {
    this.connectionId = connectionId
    this.baseUrl =
      process.env.CHANNEX_ENV === 'staging' ? CHANNEX_STAGING_URL : CHANNEX_BASE_URL
  }

  private async getApiKey(): Promise<string> {
    const connection = await prisma.channexConnection.findUniqueOrThrow({
      where: { id: this.connectionId },
    })

    if (!connection.isActive) {
      throw new Error(`Channex connection ${this.connectionId} is inactive`)
    }

    return decrypt(connection.apiKey)
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    return withRetry(async () => {
      await throttle(this.connectionId)

      const apiKey = await this.getApiKey()
      const url = new URL(`${this.baseUrl}${path}`)

      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined) url.searchParams.set(key, String(value))
        }
      }

      const response = await fetch(url.toString(), {
        method,
        headers: {
          'user-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      if (!response.ok) {
        let detail = ''
        try {
          const err = (await response.json()) as { errors?: { code?: string; title?: string } }
          detail = err?.errors?.title || err?.errors?.code || ''
        } catch {
          // ignore
        }
        throw new Error(
          `Channex API error ${response.status} ${response.statusText}${detail ? ': ' + detail : ''} (${method} ${path})`
        )
      }

      if (response.status === 204) return undefined as T

      const json = await response.json()
      console.log(`[Channex] ${method} ${path} -> ${response.status}`)
      return json as T
    })
  }

  // ==========================================
  // Properties
  // ==========================================

  async getProperties(params?: {
    'pagination[page]'?: number
    'pagination[limit]'?: number
    'filter[is_active]'?: boolean
  }): Promise<ChannexListResponse<ChannexPropertyAttributes>> {
    return this.request('GET', '/properties', undefined, params as Record<string, string | number>)
  }

  async getProperty(id: string): Promise<ChannexSingleResponse<ChannexPropertyAttributes>> {
    return this.request('GET', `/properties/${id}`)
  }

  async createProperty(
    data: ChannexPropertyInput
  ): Promise<ChannexSingleResponse<ChannexPropertyAttributes>> {
    return this.request('POST', '/properties', { property: data })
  }

  async updateProperty(
    id: string,
    data: Partial<ChannexPropertyInput>
  ): Promise<ChannexSingleResponse<ChannexPropertyAttributes>> {
    return this.request('PUT', `/properties/${id}`, { property: data })
  }

  async deleteProperty(id: string, force = false): Promise<{ meta: { message: string } }> {
    return this.request('DELETE', `/properties/${id}${force ? '?force=true' : ''}`)
  }

  // ==========================================
  // Room Types
  // ==========================================

  async getRoomTypes(params?: {
    'pagination[page]'?: number
    'pagination[limit]'?: number
    'filter[property_id]'?: string
  }): Promise<ChannexListResponse<ChannexRoomTypeAttributes>> {
    return this.request('GET', '/room_types', undefined, params as Record<string, string | number>)
  }

  async getRoomType(id: string): Promise<ChannexSingleResponse<ChannexRoomTypeAttributes>> {
    return this.request('GET', `/room_types/${id}`)
  }

  async createRoomType(
    data: ChannexRoomTypeInput
  ): Promise<ChannexSingleResponse<ChannexRoomTypeAttributes>> {
    return this.request('POST', '/room_types', { room_type: data })
  }

  async updateRoomType(
    id: string,
    data: Partial<ChannexRoomTypeInput>
  ): Promise<ChannexSingleResponse<ChannexRoomTypeAttributes>> {
    return this.request('PUT', `/room_types/${id}`, { room_type: data })
  }

  async deleteRoomType(id: string): Promise<{ meta: { message: string } }> {
    return this.request('DELETE', `/room_types/${id}`)
  }

  // ==========================================
  // Rate Plans
  // ==========================================

  async getRatePlans(params?: {
    'pagination[page]'?: number
    'pagination[limit]'?: number
    'filter[property_id]'?: string
    'filter[room_type_id]'?: string
  }): Promise<ChannexListResponse<ChannexRatePlanAttributes>> {
    return this.request('GET', '/rate_plans', undefined, params as Record<string, string | number>)
  }

  async getRatePlan(id: string): Promise<ChannexSingleResponse<ChannexRatePlanAttributes>> {
    return this.request('GET', `/rate_plans/${id}`)
  }

  async createRatePlan(
    data: ChannexRatePlanInput
  ): Promise<ChannexSingleResponse<ChannexRatePlanAttributes>> {
    return this.request('POST', '/rate_plans', { rate_plan: data })
  }

  async updateRatePlan(
    id: string,
    data: Partial<ChannexRatePlanInput>
  ): Promise<ChannexSingleResponse<ChannexRatePlanAttributes>> {
    return this.request('PUT', `/rate_plans/${id}`, { rate_plan: data })
  }

  async deleteRatePlan(id: string): Promise<{ meta: { message: string } }> {
    return this.request('DELETE', `/rate_plans/${id}`)
  }

  // ==========================================
  // ARI — Availability
  // ==========================================

  async getAvailability(params: {
    'filter[property_id]': string
    'filter[date][gte]': string
    'filter[date][lte]': string
  }): Promise<{ data: ChannexAvailability }> {
    return this.request('GET', '/availability', undefined, params as Record<string, string>)
  }

  async updateAvailability(data: ChannexARIUpdateRequest): Promise<ChannexMetaResponse> {
    return this.request('POST', '/availability', data)
  }

  // ==========================================
  // ARI — Rates & Restrictions
  // ==========================================

  async getRestrictions(params: {
    'filter[property_id]': string
    'filter[date][gte]': string
    'filter[date][lte]': string
    'filter[restrictions]'?: string // comma-separated: rate,availability,min_stay_arrival,...
  }): Promise<{ data: ChannexRestrictions }> {
    return this.request('GET', '/restrictions', undefined, params as Record<string, string>)
  }

  async updateRestrictions(data: ChannexARIUpdateRequest): Promise<ChannexMetaResponse> {
    return this.request('POST', '/restrictions', data)
  }

  // ==========================================
  // Bookings
  // ==========================================

  async getBookings(params?: {
    'pagination[page]'?: number
    'pagination[limit]'?: number
    'filter[property_id]'?: string
    'filter[arrival_date][gte]'?: string
    'filter[arrival_date][lte]'?: string
    'filter[status]'?: string
    'order[inserted_at]'?: 'asc' | 'desc'
  }): Promise<ChannexListResponse<ChannexBookingRevisionAttributes>> {
    return this.request(
      'GET',
      '/bookings',
      undefined,
      params as Record<string, string | number>
    )
  }

  async getBooking(id: string): Promise<ChannexSingleResponse<ChannexBookingRevisionAttributes>> {
    return this.request('GET', `/bookings/${id}`)
  }

  async getBookingRevisions(params?: {
    'pagination[page]'?: number
    'pagination[limit]'?: number
    'filter[property_id]'?: string
    'order[inserted_at]'?: 'asc' | 'desc'
  }): Promise<ChannexListResponse<ChannexBookingRevisionAttributes>> {
    return this.request(
      'GET',
      '/booking_revisions',
      undefined,
      params as Record<string, string | number>
    )
  }

  /** Pull the unacknowledged booking revisions feed */
  async getBookingRevisionsFeed(params?: {
    'filter[property_id]'?: string
    'order[inserted_at]'?: 'asc' | 'desc'
  }): Promise<ChannexListResponse<ChannexBookingRevisionAttributes>> {
    return this.request(
      'GET',
      '/booking_revisions/feed',
      undefined,
      params as Record<string, string>
    )
  }

  async getBookingRevision(
    id: string
  ): Promise<ChannexSingleResponse<ChannexBookingRevisionAttributes>> {
    return this.request('GET', `/booking_revisions/${id}`)
  }

  /** Acknowledge receipt of a booking revision */
  async acknowledgeBookingRevision(revisionId: string): Promise<{ meta: { message: string } }> {
    return this.request('POST', `/booking_revisions/${revisionId}/ack`)
  }

  // ==========================================
  // Webhooks
  // ==========================================

  async getWebhooks(params?: {
    'pagination[page]'?: number
    'pagination[limit]'?: number
  }): Promise<ChannexListResponse<ChannexWebhookAttributes>> {
    return this.request('GET', '/webhooks', undefined, params as Record<string, number>)
  }

  async getWebhook(id: string): Promise<ChannexSingleResponse<ChannexWebhookAttributes>> {
    return this.request('GET', `/webhooks/${id}`)
  }

  async createWebhook(
    data: ChannexWebhookInput
  ): Promise<ChannexSingleResponse<ChannexWebhookAttributes>> {
    return this.request('POST', '/webhooks', { webhook: data })
  }

  async updateWebhook(
    id: string,
    data: Partial<ChannexWebhookInput>
  ): Promise<ChannexSingleResponse<ChannexWebhookAttributes>> {
    return this.request('PUT', `/webhooks/${id}`, { webhook: data })
  }

  async deleteWebhook(id: string): Promise<{ meta: { message: string } }> {
    return this.request('DELETE', `/webhooks/${id}`)
  }
}
