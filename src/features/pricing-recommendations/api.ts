import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface PricingRecommendation {
  id: string
  organizationId: string
  propertyId: string
  date: string
  currentPrice: number
  recommendedPrice: number
  minPrice: number | null
  maxPrice: number | null
  confidence: number | null
  reason: string | null
  factors: Record<string, number> | null
  status: string
  acceptedAt: string | null
  rejectedAt: string | null
  createdAt: string
  updatedAt: string
  property?: { id: string; name: string }
}

export interface PricingRecsStats {
  total: number
  pending: number
  accepted: number
  rejected: number
  avgConfidence: number
  avgPriceDiffPct: number
  potentialRevenue: number
}

const keys = {
  all: ['pricing-recs'] as const,
  list: (p: Record<string, unknown>) => ['pricing-recs', 'list', p] as const,
  stats: () => ['pricing-recs', 'stats'] as const,
}

export function usePricingRecs(
  params: {
    page?: number
    perPage?: number
    property_id?: string
    status?: string
  } = {}
) {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.perPage) sp.set('per_page', String(params.perPage))
  if (params.property_id) sp.set('property_id', params.property_id)
  if (params.status) sp.set('status', params.status)

  return useQuery({
    queryKey: keys.list(params),
    queryFn: () =>
      api.get(`/api/pricing-recommendations?${sp.toString()}`).then((r) => r.json()),
  })
}

export function usePricingRecsStats() {
  return useQuery({
    queryKey: keys.stats(),
    queryFn: () =>
      api.get('/api/pricing-recommendations/stats').then((r) => r.json()),
  })
}

export function useGenerateRecs() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { propertyId: string }) =>
      api.post('/api/pricing-recommendations/generate', { json: data }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}

export function useAcceptRec() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.put(`/api/pricing-recommendations/${id}/accept`).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}

export function useRejectRec() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.put(`/api/pricing-recommendations/${id}/reject`).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}

export function useDeleteRec() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/pricing-recommendations/${id}`).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}
