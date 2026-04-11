import { throttle, withRetry } from './rate-limiter'
import { HostexTokenManager, tokenManager } from './token-manager'
import type {
  CreateReservationInput,
  HostexApiError,
  HostexApiResponse,
  HostexConversation,
  HostexConversationsData,
  HostexMessage,
  HostexPropertiesData,
  HostexProperty,
  HostexReservation,
  HostexReservationsData,
  HostexReview,
  HostexReviewsData,
  HostexRoomType,
  HostexRoomTypesData,
  HostexWebhook,
  HostexWebhooksData,
  UpdateAvailabilityInput,
  UpdateListingInventoriesInput,
  UpdateListingPricesInput,
  UpdateListingRestrictionsInput,
} from './types'

export class HostexClient {
  private baseUrl: string
  private connectionId: string
  private tokenMgr: HostexTokenManager

  constructor(connectionId: string, tokenMgr?: HostexTokenManager) {
    this.baseUrl = process.env.HOSTEX_API_BASE_URL || 'https://api.hostex.io/v3'
    this.connectionId = connectionId
    this.tokenMgr = tokenMgr || tokenManager
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string | number | undefined>
  ): Promise<T> {
    return withRetry(async () => {
      await throttle(this.connectionId)

      const token = await this.tokenMgr.getValidToken(this.connectionId)
      const url = new URL(`${this.baseUrl}${path}`)

      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined) url.searchParams.set(key, String(value))
        }
      }

      const headers: Record<string, string> = {
        'Hostex-Access-Token': token,
        'Content-Type': 'application/json',
      }

      const response = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })

      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as HostexApiError
        throw new Error(
          `Hostex API error ${response.status}: ${error.error_msg || response.statusText} (request_id: ${error.request_id || 'unknown'})`
        )
      }

      // Some endpoints return 204 with no body
      if (response.status === 204) return undefined as T

      const json = (await response.json()) as Record<string, unknown>

      // Hostex returns { error_code, error_msg, data: {...} }
      // error_code 200 = success, anything else = API-level error
      if (json.error_code && json.error_code !== 200) {
        throw new Error(
          `Hostex API error ${json.error_code}: ${json.error_msg || 'Unknown error'} (request_id: ${json.request_id || 'unknown'})`
        )
      }

      console.log(`[Hostex API] ${method} ${path} -> ${json.error_code || response.status}`)
      return json as T
    })
  }

  // === Properties ===
  async getProperties(params?: {
    page?: number
    per_page?: number
  }): Promise<HostexApiResponse<HostexPropertiesData>> {
    return this.request('GET', '/properties', undefined, params as Record<string, number>)
  }

  // === Room Types ===
  async getRoomTypes(params?: {
    property_id?: string
    page?: number
    per_page?: number
  }): Promise<HostexApiResponse<HostexRoomTypesData>> {
    return this.request('GET', '/room_types', undefined, params as Record<string, string | number>)
  }

  // === Reservations ===
  async getReservations(params?: {
    property_id?: string | number
    status?: string
    checkin_from?: string
    checkin_to?: string
    page?: number
    per_page?: number
  }): Promise<HostexApiResponse<HostexReservationsData>> {
    return this.request(
      'GET',
      '/reservations',
      undefined,
      params as Record<string, string | number>
    )
  }

  async createReservation(
    data: CreateReservationInput
  ): Promise<HostexApiResponse<{ reservation: HostexReservation }>> {
    return this.request('POST', '/reservations', data)
  }

  async cancelReservation(reservationCode: string): Promise<void> {
    return this.request('DELETE', `/reservations/${reservationCode}`)
  }

  async updateReservation(
    reservationCode: string,
    data: Record<string, unknown>
  ): Promise<void> {
    return this.request('PATCH', `/reservations/${reservationCode}`, data)
  }

  async updateCheckInDetails(
    reservationCode: string,
    data: Record<string, unknown>
  ): Promise<void> {
    return this.request('PATCH', `/reservations/${reservationCode}/check_in_details`, data)
  }

  // === Availability ===
  async getAvailabilities(params: {
    property_id: string | number
    start_date: string
    end_date: string
  }): Promise<HostexApiResponse<unknown>> {
    return this.request(
      'GET',
      '/availabilities',
      undefined,
      params as Record<string, string>
    )
  }

  async updateAvailabilities(data: UpdateAvailabilityInput): Promise<void> {
    return this.request('POST', '/availabilities', data)
  }

  // === Listing Prices/Inventories/Restrictions ===
  async updateListingPrices(data: UpdateListingPricesInput): Promise<void> {
    return this.request('POST', '/listings/prices', data)
  }

  async updateListingInventories(data: UpdateListingInventoriesInput): Promise<void> {
    return this.request('POST', '/listings/inventories', data)
  }

  async updateListingRestrictions(data: UpdateListingRestrictionsInput): Promise<void> {
    return this.request('POST', '/listings/restrictions', data)
  }

  // === Messaging ===
  async getConversations(params: {
    property_id: number
    offset: number
    limit?: number
  }): Promise<HostexApiResponse<HostexConversationsData>> {
    return this.request(
      'GET',
      '/conversations',
      undefined,
      params as Record<string, string | number>
    )
  }

  async getConversationDetails(
    conversationId: string
  ): Promise<HostexApiResponse<{ conversation: HostexConversation & { messages: HostexMessage[] } }>> {
    return this.request('GET', `/conversations/${conversationId}`)
  }

  async sendMessage(
    conversationId: string,
    data: { content: string; type?: 'text' | 'image' }
  ): Promise<void> {
    return this.request('POST', `/conversations/${conversationId}`, data)
  }

  // === Reviews ===
  async getReviews(params?: {
    property_id?: string | number
    page?: number
    per_page?: number
  }): Promise<HostexApiResponse<HostexReviewsData>> {
    return this.request('GET', '/reviews', undefined, params as Record<string, string | number>)
  }

  async createReview(
    reservationCode: string,
    data: { content: string; rating?: number }
  ): Promise<void> {
    return this.request('POST', `/reviews/${reservationCode}`, data)
  }

  // === Webhooks ===
  async getWebhooks(): Promise<HostexApiResponse<HostexWebhooksData>> {
    return this.request('GET', '/webhooks')
  }

  async createWebhook(data: {
    url: string
    events: string[]
  }): Promise<HostexApiResponse<{ webhook: HostexWebhook }>> {
    return this.request('POST', '/webhooks', data)
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    return this.request('DELETE', `/webhooks/${webhookId}`)
  }
}
