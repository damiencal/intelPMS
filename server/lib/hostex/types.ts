// Hostex API TypeScript types based on actual Hostex API v3.0 responses

// ==========================================
// API Response Wrapper
// ==========================================

/**
 * All Hostex API responses follow this envelope format.
 * On success: error_code=200, error_msg="Done."
 * Data is nested under a resource-specific key inside `data`.
 */
export interface HostexApiResponse<T> {
  request_id: string
  error_code: number
  error_msg: string
  data: T
}

export interface HostexApiError {
  request_id?: string
  error_code?: number
  error_msg?: string
}

// ==========================================
// Properties
// ==========================================

export interface HostexPropertyChannel {
  channel_type: string // "airbnb", "booking.com", "booking_site", "expedia", etc.
  listing_id: string
  currency: string
}

export interface HostexProperty {
  id: number
  title: string
  channels: HostexPropertyChannel[]
  cover?: {
    filename: string
    original_url: string
    small_url: string
  }
  default_checkin_time?: string
  default_checkout_time?: string
  timezone?: string
  wifi_ssid?: string
  wifi_password?: string
  wifi_remarks?: string
  address?: string
  longitude?: number
  latitude?: number
  google_place_payload?: unknown
  [key: string]: unknown
}

export interface HostexPropertiesData {
  properties: HostexProperty[]
  total: number
}

// ==========================================
// Room Types
// ==========================================

export interface HostexRoomType {
  id: number
  title: string
  properties: unknown[]
  channels: HostexPropertyChannel[]
  [key: string]: unknown
}

export interface HostexRoomTypesData {
  room_types: HostexRoomType[]
  total: number
}

// ==========================================
// Reservations
// ==========================================

export interface HostexRateAmount {
  currency: string
  amount: number
}

export interface HostexReservationRates {
  total_rate?: HostexRateAmount
  total_commission?: HostexRateAmount | null
  rate?: HostexRateAmount
  commission?: HostexRateAmount | null
  details?: unknown[]
}

export interface HostexReservation {
  reservation_code: string
  stay_code: string
  channel_id: string
  property_id: number
  channel_type: string
  listing_id: string
  check_in_date: string
  check_out_date: string
  number_of_guests: number
  number_of_adults: number
  number_of_children: number
  number_of_infants: number
  number_of_pets: number
  status: string // "confirmed", "cancelled", "pending", etc.
  stay_status?: string | null
  guest_name: string
  guest_phone?: string
  guest_email?: string
  cancelled_at?: string | null
  booked_at?: string
  created_at: string
  creator?: string
  rates?: HostexReservationRates
  check_in_details?: unknown
  remarks?: string
  channel_remarks?: string
  conversation_id?: string
  tags?: string[]
  custom_channel?: unknown
  guests?: unknown[]
  custom_fields?: unknown
  in_reservation_box?: boolean
  [key: string]: unknown
}

export interface HostexReservationsData {
  reservations: HostexReservation[]
}

// ==========================================
// Reviews
// ==========================================

export interface HostexReviewEntry {
  score?: number
  content?: string
  created_at?: string
}

export interface HostexReview {
  reservation_code: string
  property_id: number
  channel_type: string
  listing_id: string
  check_in_date: string
  check_out_date: string
  host_review?: HostexReviewEntry
  guest_review?: HostexReviewEntry
  host_reply?: unknown
  [key: string]: unknown
}

export interface HostexReviewsData {
  reviews: HostexReview[]
}

// ==========================================
// Conversations
// ==========================================

export interface HostexConversation {
  id: string
  channel_type: string
  last_message_at?: string
  guest?: {
    name?: string
    [key: string]: unknown
  }
  property_title?: string
  check_in_date?: string
  check_out_date?: string
  [key: string]: unknown
}

export interface HostexConversationsData {
  conversations: HostexConversation[]
}

export interface HostexMessage {
  id: string
  conversation_id: string
  sender: string
  content: string
  type?: string
  sent_at?: string
  [key: string]: unknown
}

// ==========================================
// Webhooks
// ==========================================

export interface HostexWebhook {
  id: string
  url: string
  events: string[]
  [key: string]: unknown
}

export interface HostexWebhooksData {
  webhooks: HostexWebhook[]
}

// ==========================================
// Listings (channels on properties)
// ==========================================

export interface HostexListing {
  channel_type: string
  listing_id: string
  currency: string
  [key: string]: unknown
}

// ==========================================
// Calendar (not available in current API tier)
// ==========================================

export interface HostexCalendarEntry {
  listing_id: string
  date: string
  price?: number
  available?: boolean
  inventory?: number
  min_stay?: number
  max_stay?: number
  closed_on_arrival?: boolean
  closed_on_departure?: boolean
}

// ==========================================
// Availability
// ==========================================

export interface HostexAvailability {
  property_id: string
  date: string
  available: boolean
  [key: string]: unknown
}

// ==========================================
// Legacy Paginated Response (kept for backward compat)
// ==========================================

export interface HostexPaginatedResponse<T> {
  data: T[]
  meta?: {
    current_page: number
    total_pages: number
    total_count: number
    per_page: number
  }
}

// ==========================================
// Input types
// ==========================================

export interface CreateReservationInput {
  property_id: number
  channel?: string
  guest_name: string
  guest_email?: string
  check_in_date: string
  check_out_date: string
  total_price?: number
  number_of_guests?: number
  [key: string]: unknown
}

export interface UpdateAvailabilityInput {
  property_id: string
  availabilities: { date: string; available: boolean }[]
}

export interface UpdateListingPricesInput {
  listing_id: string
  prices: { date: string; price: number }[]
}

export interface UpdateListingInventoriesInput {
  listing_id: string
  inventories: { date: string; inventory: number }[]
}

export interface UpdateListingRestrictionsInput {
  listing_id: string
  restrictions: {
    date: string
    min_stay?: number
    max_stay?: number
    closed_on_arrival?: boolean
    closed_on_departure?: boolean
  }[]
}
