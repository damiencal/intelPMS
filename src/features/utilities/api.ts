import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface UtilityBill {
  id: string
  organizationId: string
  propertyId: string
  utilityType: string
  provider: string | null
  accountNumber: string | null
  billingPeriodStart: string
  billingPeriodEnd: string
  amount: number
  currency: string
  usage: number | null
  usageUnit: string | null
  dueDate: string | null
  paidDate: string | null
  status: string
  notes: string | null
  createdAt: string
  updatedAt: string
  property?: { id: string; name: string }
}

export interface UtilityStats {
  totalBills: number
  totalAmount: number
  pendingCount: number
  pendingAmount: number
  overdueCount: number
  overdueAmount: number
  byType: Record<string, { count: number; total: number }>
  monthlyTrend: { month: string; amount: number }[]
}

export const UTILITY_TYPES = [
  { value: 'electric', label: 'Electric', icon: '⚡' },
  { value: 'water', label: 'Water', icon: '💧' },
  { value: 'gas', label: 'Gas', icon: '🔥' },
  { value: 'internet', label: 'Internet', icon: '🌐' },
  { value: 'trash', label: 'Trash', icon: '🗑️' },
  { value: 'sewer', label: 'Sewer', icon: '🚰' },
  { value: 'cable', label: 'Cable/TV', icon: '📺' },
]

export const BILL_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'disputed', label: 'Disputed' },
]

const keys = {
  all: ['utilities'] as const,
  list: (p: Record<string, unknown>) => ['utilities', 'list', p] as const,
  stats: () => ['utilities', 'stats'] as const,
}

export function useUtilityBills(
  params: {
    page?: number
    perPage?: number
    property_id?: string
    utility_type?: string
    status?: string
    search?: string
  } = {}
) {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.perPage) sp.set('per_page', String(params.perPage))
  if (params.property_id) sp.set('property_id', params.property_id)
  if (params.utility_type) sp.set('utility_type', params.utility_type)
  if (params.status) sp.set('status', params.status)
  if (params.search) sp.set('search', params.search)

  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => api.get(`/api/utilities?${sp.toString()}`).then((r) => r.json()),
  })
}

export function useUtilityStats() {
  return useQuery({
    queryKey: keys.stats(),
    queryFn: () => api.get('/api/utilities/stats').then((r) => r.json()),
  })
}

export function useCreateUtilityBill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/api/utilities', { json: data }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}

export function useUpdateUtilityBill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) =>
      api.put(`/api/utilities/${id}`, { json: data }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}

export function useDeleteUtilityBill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/utilities/${id}`).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}
