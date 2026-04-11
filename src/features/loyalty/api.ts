import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface LoyaltyMember {
  id: string
  organizationId: string
  guestName: string
  guestEmail: string
  phone: string | null
  tier: string
  totalStays: number
  totalSpent: number
  pointsBalance: number
  pointsEarned: number
  pointsRedeemed: number
  lastStayDate: string | null
  enrolledAt: string
  notes: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export interface LoyaltyStats {
  totalMembers: number
  tierCounts: { bronze: number; silver: number; gold: number; platinum: number }
  totalStays: number
  totalRevenue: number
  outstandingPoints: number
}

export const LOYALTY_TIERS = [
  { value: 'bronze', label: 'Bronze', color: 'bg-amber-700' },
  { value: 'silver', label: 'Silver', color: 'bg-gray-400' },
  { value: 'gold', label: 'Gold', color: 'bg-yellow-500' },
  { value: 'platinum', label: 'Platinum', color: 'bg-slate-300' },
]

export const MEMBER_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
]

const keys = {
  all: ['loyalty'] as const,
  list: (p: Record<string, unknown>) => ['loyalty', 'list', p] as const,
  stats: () => ['loyalty', 'stats'] as const,
}

export function useLoyaltyMembers(
  params: {
    page?: number
    perPage?: number
    tier?: string
    status?: string
    search?: string
  } = {}
) {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.perPage) sp.set('per_page', String(params.perPage))
  if (params.tier) sp.set('tier', params.tier)
  if (params.status) sp.set('status', params.status)
  if (params.search) sp.set('search', params.search)

  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => api.get(`/api/loyalty?${sp.toString()}`).then((r) => r.json()),
  })
}

export function useLoyaltyStats() {
  return useQuery({
    queryKey: keys.stats(),
    queryFn: () => api.get('/api/loyalty/stats').then((r) => r.json()),
  })
}

export function useCreateLoyaltyMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/api/loyalty', { json: data }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}

export function useUpdateLoyaltyMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) =>
      api.put(`/api/loyalty/${id}`, { json: data }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}

export function useAddPoints() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, points }: { id: string; points: number }) =>
      api.put(`/api/loyalty/${id}/add-points`, { json: { points } }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}

export function useRedeemPoints() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, points }: { id: string; points: number }) =>
      api.put(`/api/loyalty/${id}/redeem-points`, { json: { points } }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}

export function useDeleteLoyaltyMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/loyalty/${id}`).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}
