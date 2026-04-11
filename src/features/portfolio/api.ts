import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface PropertyMetric {
  id: string
  name: string
  address: string | null
  currency: string
  imageUrl: string | null
  totalRevenue: number
  recentRevenue: number
  totalExpenses: number
  recentExpenses: number
  netIncome: number
  totalReservations: number
  recentReservations: number
  avgRating: number | null
  reviewCount: number
  occupancyRate: number
  openMaintenance: number
  channelCount: number
  avgNightlyRate: number
}

export interface PortfolioSummary {
  totalProperties: number
  totalRevenue: number
  recentRevenue: number
  totalExpenses: number
  totalNetIncome: number
  avgOccupancy: number
  avgRating: number | null
  totalReservations: number
  totalOpenMaintenance: number
}

export interface PortfolioData {
  summary: PortfolioSummary
  properties: PropertyMetric[]
  rankings: {
    topByRevenue: { id: string; name: string; value: number }[]
    topByOccupancy: { id: string; name: string; value: number }[]
    topByRating: { id: string; name: string; value: number | null }[]
  }
}

const keys = {
  all: ['portfolio'] as const,
}

export function usePortfolio() {
  return useQuery({
    queryKey: keys.all,
    queryFn: () => api.get('/portfolio'),
    select: (res: { data: PortfolioData }) => res.data,
  })
}
