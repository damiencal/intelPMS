import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface CompetitorRate {
  id: string
  organizationId: string
  propertyId: string
  competitorName: string
  competitorUrl: string | null
  platform: string
  competitorPrice: number
  yourPrice: number
  priceDiff: number
  priceDiffPct: number
  checkDate: string
  checkInDate: string
  checkOutDate: string
  guests: number | null
  bedrooms: number | null
  rating: number | null
  reviewCount: number | null
  notes: string | null
  createdAt: string
  property?: { id: string; name: string }
}

export interface CompetitorSummary {
  totalChecks: number
  avgDiff: number
  cheaperThanYou: number
  moreExpensive: number
  propertiesTracked: number
  properties: {
    propertyId: string
    propertyName: string
    latestCheck: string
    competitorCount: number
    avgPriceDiff: number
    cheaperCount: number
    moreExpensiveCount: number
  }[]
}

export const PLATFORMS = [
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'booking', label: 'Booking.com' },
  { value: 'vrbo', label: 'VRBO' },
  { value: 'expedia', label: 'Expedia' },
  { value: 'direct', label: 'Direct' },
  { value: 'other', label: 'Other' },
]

const keys = {
  all: ['competitor-rates'] as const,
  list: (p: Record<string, unknown>) => ['competitor-rates', 'list', p] as const,
  summary: () => ['competitor-rates', 'summary'] as const,
}

export function useCompetitorRates(
  params: {
    page?: number
    perPage?: number
    property_id?: string
    platform?: string
    search?: string
  } = {}
) {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.perPage) sp.set('per_page', String(params.perPage))
  if (params.property_id) sp.set('property_id', params.property_id)
  if (params.platform) sp.set('platform', params.platform)
  if (params.search) sp.set('search', params.search)

  return useQuery({
    queryKey: keys.list(params),
    queryFn: () =>
      api.get(`/api/competitor-rates?${sp.toString()}`).then((r) => r.json()),
  })
}

export function useCompetitorSummary() {
  return useQuery({
    queryKey: keys.summary(),
    queryFn: () =>
      api.get('/api/competitor-rates/summary').then((r) => r.json()),
  })
}

export function useCreateCompetitorRate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/api/competitor-rates', { json: data }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}

export function useDeleteCompetitorRate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/competitor-rates/${id}`).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}
