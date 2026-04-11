import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ---- Types ----

export interface PropertyListing {
  id: string
  channel: string
  channelName: string
  isActive: boolean
}

export interface PropertyListingFull extends PropertyListing {
  hostexId: string
  listingUrl: string | null
  basePrice: number | null
  currency: string
  metadata: Record<string, unknown> | null
}

export interface Property {
  id: string
  hostexId: string
  name: string
  address: string | null
  currency: string
  timezone: string
  imageUrl: string | null
  createdAt: string
  listings: PropertyListing[]
  _count: { reservations: number; reviews: number }
}

interface PropertiesResponse {
  data: Property[]
  meta: { total: number; page: number; perPage: number; totalPages: number }
}

export interface PropertyDetail extends Omit<Property, 'listings'> {
  listings: PropertyListingFull[]
  roomTypes: { id: string; name: string; maxGuests: number | null }[]
}

interface PropertyDetailResponse {
  data: PropertyDetail
}

export interface Reservation {
  id: string
  hostexId: string
  propertyId: string
  channel: string | null
  guestName: string | null
  guestEmail: string | null
  guestPhone: string | null
  checkIn: string
  checkOut: string
  status: string
  totalPrice: number | null
  currency: string
  numGuests: number | null
  confirmationCode: string | null
  createdAt: string
  property?: { id: string; name: string; imageUrl: string | null }
}

interface ReservationsResponse {
  data: Reservation[]
  meta: { total: number; page: number; perPage: number; totalPages: number }
}

export interface Review {
  id: string
  hostexId: string
  propertyId: string
  channel: string | null
  guestName: string | null
  rating: number | null
  content: string | null
  sentiment: string | null
  responseStatus: string
  responseDraft: string | null
  respondedAt: string | null
  reviewDate: string | null
  createdAt: string
  property?: { id: string; name: string; imageUrl: string | null }
}

interface ReviewsResponse {
  data: Review[]
  meta: { total: number; page: number; perPage: number; totalPages: number }
}

export interface CalendarEntry {
  id: string
  listingId: string
  date: string
  price: number | null
  available: boolean
  inventory: number
  minStay: number | null
  maxStay: number | null
  listing: { id: string; channel: string; channelName: string }
}

interface CalendarResponse {
  data: CalendarEntry[]
}

export interface ConciergeKnowledge {
  id: string
  propertyId: string
  checkInInstructions: string | null
  houseRules: string | null
  localRestaurants: string | null
  localActivities: string | null
  transportation: string | null
  customNotes: string | null
}

interface ConciergeResponse {
  data: ConciergeKnowledge | null
  property: { id: string; name: string }
}

// ---- Query keys ----

export const propertyKeys = {
  all: ['properties'] as const,
  list: (params: Record<string, unknown>) => ['properties', 'list', params] as const,
  detail: (id: string) => ['properties', id] as const,
  calendar: (id: string, start: string, end: string) => ['properties', id, 'calendar', start, end] as const,
  reservations: (id: string, params: Record<string, unknown>) => ['properties', id, 'reservations', params] as const,
  reviews: (id: string, params: Record<string, unknown>) => ['properties', id, 'reviews', params] as const,
  concierge: (id: string) => ['properties', id, 'concierge'] as const,
}

export const reservationKeys = {
  all: ['reservations'] as const,
  list: (params: Record<string, unknown>) => ['reservations', 'list', params] as const,
}

export const reviewKeys = {
  all: ['reviews'] as const,
  list: (params: Record<string, unknown>) => ['reviews', 'list', params] as const,
}

// ---- Hooks ----

export function useProperties(params: { page?: number; perPage?: number } = {}) {
  const { page = 1, perPage = 20 } = params
  return useQuery({
    queryKey: propertyKeys.list({ page, perPage }),
    queryFn: () => api.get<PropertiesResponse>(`/properties?page=${page}&per_page=${perPage}`),
  })
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: () => api.get<PropertyDetailResponse>(`/properties/${id}`),
    select: (data) => data.data,
    enabled: !!id,
  })
}

export function usePropertyCalendar(id: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: propertyKeys.calendar(id, startDate, endDate),
    queryFn: () =>
      api.get<CalendarResponse>(
        `/properties/${id}/calendar?start_date=${startDate}&end_date=${endDate}`
      ),
    select: (data) => data.data,
    enabled: !!id && !!startDate && !!endDate,
  })
}

export function usePropertyReservations(id: string, params: { page?: number; perPage?: number; status?: string } = {}) {
  const { page = 1, perPage = 20, status } = params
  const searchParams = new URLSearchParams({ page: String(page), per_page: String(perPage) })
  if (status) searchParams.set('status', status)

  return useQuery({
    queryKey: propertyKeys.reservations(id, params),
    queryFn: () => api.get<ReservationsResponse>(`/properties/${id}/reservations?${searchParams}`),
    enabled: !!id,
  })
}

export function usePropertyReviews(id: string, params: { page?: number; perPage?: number } = {}) {
  const { page = 1, perPage = 20 } = params
  return useQuery({
    queryKey: propertyKeys.reviews(id, params),
    queryFn: () => api.get<ReviewsResponse>(`/properties/${id}/reviews?page=${page}&per_page=${perPage}`),
    enabled: !!id,
  })
}

// Cross-property reservations
export function useReservations(params: { page?: number; perPage?: number; status?: string; search?: string } = {}) {
  const { page = 1, perPage = 20, status, search } = params
  const searchParams = new URLSearchParams({ page: String(page), per_page: String(perPage) })
  if (status) searchParams.set('status', status)
  if (search) searchParams.set('search', search)

  return useQuery({
    queryKey: reservationKeys.list(params),
    queryFn: () => api.get<ReservationsResponse>(`/reservations?${searchParams}`),
  })
}

// Cross-property reviews
export function useReviews(params: { page?: number; perPage?: number; sentiment?: string; responseStatus?: string; search?: string } = {}) {
  const { page = 1, perPage = 20, sentiment, responseStatus, search } = params
  const searchParams = new URLSearchParams({ page: String(page), per_page: String(perPage) })
  if (sentiment) searchParams.set('sentiment', sentiment)
  if (responseStatus) searchParams.set('response_status', responseStatus)
  if (search) searchParams.set('search', search)

  return useQuery({
    queryKey: reviewKeys.list(params),
    queryFn: () => api.get<ReviewsResponse>(`/reviews?${searchParams}`),
  })
}

// ---- Concierge Knowledge ----

export function useUpdateReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string
      responseDraft?: string
      responseStatus?: string
      respondedAt?: string
    }) => api.patch<{ data: Review }>(`/reviews/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all })
    },
  })
}

export function useConciergeKnowledge(propertyId: string) {
  return useQuery({
    queryKey: propertyKeys.concierge(propertyId),
    queryFn: () => api.get<ConciergeResponse>(`/concierge/${propertyId}`),
    select: (res) => res.data,
    enabled: !!propertyId,
  })
}

export function useUpdateConcierge(propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Omit<ConciergeKnowledge, 'id' | 'propertyId'>>) =>
      api.put<{ data: ConciergeKnowledge }>(`/concierge/${propertyId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.concierge(propertyId) })
    },
  })
}
