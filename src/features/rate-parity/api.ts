import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface RateParityCheck {
  id: string
  organizationId: string
  propertyId: string
  checkDate: string
  channels: { name: string; price: number; url?: string }[]
  basePrice: number | null
  lowestPrice: number | null
  highestPrice: number | null
  priceDiffPct: number | null
  parityStatus: string
  notes: string | null
  createdAt: string
  updatedAt: string
  property?: { id: string; name: string }
}

export interface ParitySummary {
  totalProperties: number
  lastChecks: {
    propertyId: string
    propertyName: string
    parityStatus: string
    priceDiffPct: number | null
    checkDate: string
  }[]
  inParity: number
  minorDiff: number
  majorDiff: number
  unchecked: number
}

export const PARITY_STATUSES = [
  { value: 'in_parity', label: 'In Parity' },
  { value: 'minor_diff', label: 'Minor Difference' },
  { value: 'major_diff', label: 'Major Difference' },
]

const parityKeys = {
  all: ['rate-parity'] as const,
  list: (p: Record<string, unknown>) => ['rate-parity', 'list', p] as const,
  summary: () => ['rate-parity', 'summary'] as const,
}

export function useRateParityChecks(
  params: {
    page?: number
    perPage?: number
    property_id?: string
    parity_status?: string
  } = {}
) {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.perPage) sp.set('per_page', String(params.perPage))
  if (params.property_id) sp.set('property_id', params.property_id)
  if (params.parity_status) sp.set('parity_status', params.parity_status)

  return useQuery({
    queryKey: parityKeys.list(params),
    queryFn: () =>
      api.get(`/api/rate-parity?${sp.toString()}`).then((r) => r.json()),
  })
}

export function useParitySummary() {
  return useQuery<{ data: ParitySummary }>({
    queryKey: parityKeys.summary(),
    queryFn: () => api.get('/api/rate-parity/summary').then((r) => r.json()),
  })
}

export function useCreateParityCheck() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/api/rate-parity', { json: data }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: parityKeys.all })
    },
  })
}

export function useDeleteParityCheck() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/rate-parity/${id}`).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: parityKeys.all })
    },
  })
}
