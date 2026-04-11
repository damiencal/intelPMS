import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface ForecastMonth {
  month: string
  revenue: number
  expenses: number
  netIncome: number
  bookings: number
  isForecast: boolean
}

export interface ForecastSummary {
  avgMonthlyRevenue: number
  avgMonthlyExpenses: number
  avgMonthlyNet: number
  projectedAnnualRevenue: number
  projectedAnnualExpenses: number
  projectedAnnualNet: number
  totalBookings: number
  historicalMonths: number
  forecastMonths: number
}

export interface PropertyBreakdown {
  propertyId: string
  propertyName: string
  revenue: number
  expenses: number
  netIncome: number
  margin: number
}

export interface OccupancyData {
  month: string
  occupancyRate: number
  bookedNights: number
  totalNights: number
}

const forecastKeys = {
  all: ['revenue-forecast'] as const,
  monthly: (p: Record<string, unknown>) => ['revenue-forecast', 'monthly', p] as const,
  byProperty: (year: number) => ['revenue-forecast', 'by-property', year] as const,
  occupancy: (months: number) => ['revenue-forecast', 'occupancy', months] as const,
}

export function useRevenueForecast(params: {
  months?: number
  propertyId?: string
} = {}) {
  const sp = new URLSearchParams()
  if (params.months) sp.set('months', String(params.months))
  if (params.propertyId) sp.set('property_id', params.propertyId)

  return useQuery<{ data: { months: ForecastMonth[]; summary: ForecastSummary } }>({
    queryKey: forecastKeys.monthly(params),
    queryFn: () => api.get(`/api/revenue-forecast?${sp.toString()}`).then((r) => r.json()),
  })
}

export function useRevenueByProperty(year: number = new Date().getFullYear()) {
  return useQuery<{ data: PropertyBreakdown[] }>({
    queryKey: forecastKeys.byProperty(year),
    queryFn: () => api.get(`/api/revenue-forecast/by-property?year=${year}`).then((r) => r.json()),
  })
}

export function useOccupancyTrends(months: number = 12) {
  return useQuery<{ data: OccupancyData[] }>({
    queryKey: forecastKeys.occupancy(months),
    queryFn: () => api.get(`/api/revenue-forecast/occupancy?months=${months}`).then((r) => r.json()),
  })
}
