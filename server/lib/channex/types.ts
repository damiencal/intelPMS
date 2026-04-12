// Channex.io API v1 TypeScript types
// Docs: https://docs.channex.io/api-v.1-documentation/api-reference

// ==========================================
// Generic API Response envelope
// ==========================================

/**
 * Channex wraps successful list responses like:
 * { "data": [ { "type": "property", "id": "...", "attributes": {...} } ], "meta": {...} }
 *
 * Single item responses:
 * { "data": { "type": "property", "id": "...", "attributes": {...} } }
 *
 * Error responses:
 * { "errors": { "code": "...", "title": "...", "details": {...} } }
 */

export interface ChannexResource<T> {
  type: string
  id: string
  attributes: T
  relationships?: Record<string, { data: { type: string; id: string } | null }>
}

export interface ChannexListResponse<T> {
  data: Array<ChannexResource<T>>
  meta: ChannexMeta
}

export interface ChannexSingleResponse<T> {
  data: ChannexResource<T>
}

export interface ChannexMeta {
  page: number
  limit: number
  total: number
}

export interface ChannexMetaMessage {
  message: string
  warnings?: unknown[]
}

export interface ChannexMetaResponse {
  meta: ChannexMetaMessage
  data?: unknown[]
}

export interface ChannexError {
  errors: {
    code: string
    title: string
    details?: Record<string, string[]>
  }
}

// ==========================================
// Properties (Hotels)
// ==========================================

export interface ChannexPropertyAttributes {
  title: string
  currency: string
  email?: string | null
  phone?: string | null
  zip_code?: string | null
  country?: string | null
  state?: string | null
  city?: string | null
  address?: string | null
  longitude?: string | null
  latitude?: string | null
  timezone?: string | null
  facilities?: string[]
  property_type?: string | null
  is_active?: boolean
  acc_channels_count?: number
  settings?: {
    allow_availability_autoupdate_on_confirmation?: boolean
    allow_availability_autoupdate_on_modification?: boolean
    allow_availability_autoupdate_on_cancellation?: boolean
    min_stay_type?: string
    min_price?: number | null
    max_price?: number | null
    state_length?: number
    cut_off_time?: string
    cut_off_days?: number
    max_day_advance?: number | null
  }
  content?: {
    description?: string | null
    important_information?: string | null
    photos?: Array<{
      url: string
      position: number
      author?: string
      kind: string
      description?: string
    }>
  }
  logo_url?: string | null
  website?: string | null
  [key: string]: unknown
}

export interface ChannexPropertyInput {
  title: string
  currency: string
  email?: string
  phone?: string
  zip_code?: string
  country?: string
  state?: string
  city?: string
  address?: string
  longitude?: string
  latitude?: string
  timezone?: string
  property_type?: string
  settings?: {
    allow_availability_autoupdate_on_confirmation?: boolean
    allow_availability_autoupdate_on_modification?: boolean
    allow_availability_autoupdate_on_cancellation?: boolean
    min_stay_type?: string
    state_length?: number
  }
}

// ==========================================
// Room Types
// ==========================================

export interface ChannexRoomTypeAttributes {
  title: string
  property_id: string
  count_of_rooms?: number
  occupancy?: number
  min_occupancy?: number | null
  max_occupancy?: number | null
  max_adults?: number | null
  max_children?: number | null
  max_infant?: number | null
  overbooking_level?: number
  description?: string | null
  [key: string]: unknown
}

export interface ChannexRoomTypeInput {
  title: string
  property_id: string
  count_of_rooms?: number
  occupancy?: number
  overbooking_level?: number
  description?: string
}

// ==========================================
// Rate Plans
// ==========================================

export interface ChannexRatePlanAttributes {
  title: string
  property_id: string
  room_type_id: string
  currency: string
  sell_mode?: string // per_room, per_person
  rate_plan_category?: string
  parent_rate_plan_id?: string | null
  inherit_rate?: boolean
  inherit_closed_to_arrival?: boolean
  inherit_closed_to_departure?: boolean
  inherit_stop_sell?: boolean
  inherit_min_stay_arrival?: boolean
  inherit_max_stay?: boolean
  closed_to_arrival?: boolean
  closed_to_departure?: boolean
  stop_sell?: boolean
  min_stay_arrival?: number
  max_stay?: number
  options?: Array<{
    occupancy: number
    rate: number
    is_primary: boolean
    derived_option?: Record<string, unknown>
  }>
  [key: string]: unknown
}

export interface ChannexRatePlanInput {
  title: string
  property_id: string
  room_type_id: string
  currency: string
  sell_mode?: string
  rate_plan_category?: string
}

// ==========================================
// ARI (Availability, Rates & Restrictions)
// ==========================================

export interface ChannexARIUpdateValue {
  property_id: string
  rate_plan_id?: string
  room_type_id?: string
  date?: string // YYYY-MM-DD (single date)
  date_from?: string // YYYY-MM-DD (range start)
  date_to?: string // YYYY-MM-DD (range end)
  days?: string[] // ["mo","tu","we","th","fr","sa","su"]
  // Rate & Restriction fields
  rate?: number | string
  min_stay_arrival?: number
  min_stay_through?: number
  min_stay?: number
  max_stay?: number
  closed_to_arrival?: boolean | 0 | 1
  closed_to_departure?: boolean | 0 | 1
  stop_sell?: boolean | 0 | 1
  availability?: number
  // Multi-occupancy rates
  rates?: Array<{ occupancy: number; rate: number }>
}

export interface ChannexARIUpdateRequest {
  values: ChannexARIUpdateValue[]
}

// Restriction object from GET /restrictions
export type ChannexRestrictions = Record<
  string, // rate_plan_id
  Record<
    string, // date YYYY-MM-DD
    {
      rate?: number
      availability?: number
      min_stay_arrival?: number
      min_stay_through?: number
      min_stay?: number
      max_stay?: number
      closed_to_arrival?: boolean
      closed_to_departure?: boolean
      stop_sell?: boolean
      availability_offset?: number
      max_availability?: number
      booked?: number
    }
  >
>

// Availability object from GET /availability
export type ChannexAvailability = Record<
  string, // room_type_id
  Record<string, number> // date -> count
>

// ==========================================
// Bookings
// ==========================================

export interface ChannexBookingCustomer {
  name?: string | null
  surname?: string | null
  mail?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  company?: string | null
  country?: string | null
  language?: string | null
  zip?: string | null
  meta?: Record<string, unknown>
}

export interface ChannexBookingRoom {
  booking_room_id: string
  rate_plan_id?: string | null
  room_type_id?: string | null
  checkin_date: string
  checkout_date: string
  occupancy: {
    adults: number
    children: number
    infants: number
    ages?: number[]
  }
  amount?: string | number
  days?: Record<string, string>
  guests?: Array<{ name?: string; surname?: string }> | null
  services?: ChannexBookingService[]
  taxes?: ChannexBookingTax[]
  meta?: Record<string, unknown>
  ota_unique_id?: string | null
  is_cancelled?: boolean
}

export interface ChannexBookingService {
  name: string
  nights?: number
  persons?: number
  price_mode?: string
  price_per_unit?: string
  total_price?: string
}

export interface ChannexBookingTax {
  is_inclusive: boolean
  name: string
  total_price: string
  type: string
  nights?: number
  persons?: number
  price_mode?: string
  price_per_unit?: string
}

export interface ChannexBookingGuarantee {
  card_number?: string
  card_type?: string
  cardholder_name?: string
  cvv?: string
  expiration_date?: string
  is_virtual?: boolean
  meta?: Record<string, unknown>
}

export interface ChannexBookingRevisionAttributes {
  id: string
  booking_id: string
  revision_id: string
  unique_id: string
  system_id?: string | null
  ota_reservation_code: string
  ota_name: string
  status: 'new' | 'modified' | 'cancelled'
  property_id: string
  arrival_date: string
  departure_date: string
  arrival_hour?: string | null
  occupancy: {
    adults: number
    children: number
    infants: number
  }
  amount?: string
  currency?: string
  notes?: string | null
  payment_collect?: 'property' | 'ota' | null
  payment_type?: 'credit_card' | 'bank_transfer' | null
  ota_commission?: string | null
  inserted_at: string
  customer?: ChannexBookingCustomer | null
  rooms: ChannexBookingRoom[]
  services?: ChannexBookingService[]
  guarantee?: ChannexBookingGuarantee | null
  acknowledge_status?: string
  has_unacked_revisions?: boolean
  [key: string]: unknown
}

// ==========================================
// Webhooks
// ==========================================

export interface ChannexWebhookAttributes {
  callback_url: string
  event_mask: string // semicolon-separated event names e.g. "booking_new;booking_cancellation"
  property_id?: string | null
  is_global?: boolean
  request_params?: Record<string, unknown>
  headers?: Record<string, string>
  is_active: boolean
  send_data: boolean
  protected?: boolean
}

export interface ChannexWebhookInput {
  callback_url: string
  event_mask: string
  property_id?: string | null
  is_global?: boolean
  request_params?: Record<string, unknown>
  headers?: Record<string, string>
  is_active?: boolean
  send_data?: boolean
  protected?: boolean
}

// ==========================================
// Webhook Payloads (incoming push events)
// ==========================================

export interface ChannexWebhookEvent {
  event: string
  property_id: string
  user_id: string | null
  timestamp: string
  payload?: unknown
}

export interface ChannexARIWebhookPayload {
  availability?: number
  booked?: number
  date: string
  rate_plan_id: string
  room_type_id: string
  stop_sell?: boolean
  [key: string]: unknown
}

export interface ChannexBookingWebhookPayload {
  booking_id: string
  property_id: string
  revision_id: string
}

export interface ChannexMessageWebhookPayload {
  id: string
  message: string
  sender: 'guest' | 'host' | 'system'
  property_id: string
  booking_id?: string
  message_thread_id?: string
  [key: string]: unknown
}

export interface ChannexReviewWebhookPayload {
  id: string
  ota: string
  property_id: string
  scores?: Array<{ category: string; score: number }>
  overall_score?: number
  content?: string | null
  reply?: string | null
  reviewer_name?: string | null
  booking_id?: string
  ota_reservation_id?: string
  ota_review_id?: string
  received_at?: string
  [key: string]: unknown
}
