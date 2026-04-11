import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface SecurityDeposit {
  id: string
  organizationId: string
  propertyId: string
  reservationId: string | null
  guestName: string
  amount: number
  currency: string
  status: string
  collectedDate: string
  refundDate: string | null
  refundAmount: number | null
  claimAmount: number | null
  claimReason: string | null
  damagePhotos: string[] | null
  notes: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  property?: { id: string; name: string }
}

export interface DepositStats {
  total: number
  held: number
  totalHeld: number
  totalRefunded: number
  totalClaimed: number
  disputed: number
}

export const DEPOSIT_STATUSES = [
  { value: 'held', label: 'Held' },
  { value: 'partially_refunded', label: 'Partially Refunded' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'claimed', label: 'Claimed' },
  { value: 'disputed', label: 'Disputed' },
]

const depositKeys = {
  all: ['security-deposits'] as const,
  list: (p: Record<string, unknown>) => ['security-deposits', 'list', p] as const,
  stats: () => ['security-deposits', 'stats'] as const,
}

export function useSecurityDeposits(
  params: {
    page?: number
    perPage?: number
    property_id?: string
    status?: string
    search?: string
  } = {}
) {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.perPage) sp.set('per_page', String(params.perPage))
  if (params.property_id) sp.set('property_id', params.property_id)
  if (params.status) sp.set('status', params.status)
  if (params.search) sp.set('search', params.search)

  return useQuery({
    queryKey: depositKeys.list(params),
    queryFn: () =>
      api.get(`/api/security-deposits?${sp.toString()}`).then((r) => r.json()),
  })
}

export function useDepositStats() {
  return useQuery<{ data: DepositStats }>({
    queryKey: depositKeys.stats(),
    queryFn: () => api.get('/api/security-deposits/stats').then((r) => r.json()),
  })
}

export function useCreateDeposit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/api/security-deposits', { json: data }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: depositKeys.all })
    },
  })
}

export function useUpdateDeposit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown> & { id: string }) =>
      api.put(`/api/security-deposits/${id}`, { json: data }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: depositKeys.all })
    },
  })
}

export function useDeleteDeposit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/security-deposits/${id}`).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: depositKeys.all })
    },
  })
}
