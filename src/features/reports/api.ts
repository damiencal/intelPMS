import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ---- Types ----

export interface RevenueReport {
  totals: {
    revenue: number
    bookings: number
    nights: number
    avgNightlyRate: number
    properties: number
  }
  monthlyRevenue: {
    month: string
    revenue: number
    bookings: number
    nights: number
  }[]
  propertyBreakdown: {
    id: string
    name: string
    currency: string
    revenue: number
    bookings: number
    nights: number
    avgNightlyRate: number
  }[]
  channelBreakdown: {
    channel: string
    revenue: number
    bookings: number
  }[]
}

export interface OccupancyReport {
  id: string
  name: string
  totalDays: number
  bookedDays: number
  occupancyRate: number
}

// ---- Hooks ----

export function useRevenueReport(months = 12, propertyId?: string) {
  const params = new URLSearchParams({ months: String(months) })
  if (propertyId) params.set('property_id', propertyId)

  return useQuery({
    queryKey: ['reports', 'revenue', months, propertyId],
    queryFn: () =>
      api.get<{ data: RevenueReport }>(`/reports/revenue?${params}`),
    select: (res) => res.data,
  })
}

export function useOccupancyReport(months = 3) {
  return useQuery({
    queryKey: ['reports', 'occupancy', months],
    queryFn: () =>
      api.get<{ data: OccupancyReport[] }>(
        `/reports/occupancy?months=${months}`
      ),
    select: (res) => res.data,
  })
}
