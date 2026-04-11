import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ---- Types ----

export interface Reservation {
  id: string
  hostexId: string
  propertyId: string
  property: { id: string; name: string; imageUrl?: string }
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
  source: string | null
  createdAt: string
}

export interface UpcomingData {
  checkIns: Reservation[]
  checkOuts: Reservation[]
  currentGuests: Reservation[]
  summary: {
    todayCheckIns: number
    todayCheckOuts: number
    currentGuestsCount: number
    upcomingCheckIns: number
  }
}

// ---- Hooks ----

export function useReservations(params: {
  page?: number
  perPage?: number
  status?: string
  propertyId?: string
  search?: string
} = {}) {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.perPage) searchParams.set('per_page', String(params.perPage))
  if (params.status) searchParams.set('status', params.status)
  if (params.propertyId) searchParams.set('property_id', params.propertyId)
  if (params.search) searchParams.set('search', params.search)

  return useQuery({
    queryKey: ['reservations', params],
    queryFn: () =>
      api.get<{
        data: Reservation[]
        meta: { total: number; page: number; perPage: number; totalPages: number }
      }>(`/reservations?${searchParams}`),
  })
}

export function useUpcomingReservations(days = 7) {
  return useQuery({
    queryKey: ['reservations', 'upcoming', days],
    queryFn: () =>
      api.get<{ data: UpcomingData }>(`/reservations/upcoming?days=${days}`),
    select: (res) => res.data,
  })
}
