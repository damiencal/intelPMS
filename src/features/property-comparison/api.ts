import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface PropertyComparison {
  propertyId: string
  propertyName: string
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  margin: number
  totalBookings: number
  occupancyRate: number
  bookedNights: number
  avgNightlyRate: number
  revPAR: number
  avgRating: number
  totalReviews: number
  maintenanceRequests: number
  maintenanceCost: number
}

export interface PortfolioSummary {
  totalProperties: number
  avgRevenue: number
  avgOccupancy: number
  avgNightlyRate: number
  totalRevenue: number
  totalExpenses: number
  totalNetIncome: number
}

const comparisonKeys = {
  all: ['property-comparison'] as const,
  list: (year: number) => ['property-comparison', 'list', year] as const,
}

export function usePropertyComparison(year: number = new Date().getFullYear()) {
  return useQuery<{
    data: PropertyComparison[]
    summary: PortfolioSummary
  }>({
    queryKey: comparisonKeys.list(year),
    queryFn: () =>
      api.get(`/api/property-comparison?year=${year}`).then((r) => r.json()),
  })
}
