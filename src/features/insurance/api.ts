import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface InsurancePolicy {
  id: string
  organizationId: string
  propertyId: string
  policyNumber: string
  provider: string
  type: string
  coverageAmount: number
  premiumAmount: number
  premiumFrequency: string
  deductible: number | null
  startDate: string
  endDate: string
  status: string
  claimCount: number
  totalClaimed: number
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
  notes: string | null
  documents: string[] | null
  createdAt: string
  updatedAt: string
  property?: { id: string; name: string }
}

export interface InsuranceStats {
  totalPolicies: number
  activePolicies: number
  totalAnnualPremium: number
  totalCoverage: number
  totalClaimed: number
  expiringSoon: number
}

export const POLICY_TYPES = [
  { value: 'property', label: 'Property' },
  { value: 'liability', label: 'Liability' },
  { value: 'contents', label: 'Contents' },
  { value: 'loss_of_income', label: 'Loss of Income' },
  { value: 'umbrella', label: 'Umbrella' },
]

export const POLICY_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'pending_renewal', label: 'Pending Renewal' },
]

export const PREMIUM_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
]

const keys = {
  all: ['insurance'] as const,
  list: (p: Record<string, unknown>) => ['insurance', 'list', p] as const,
  stats: () => ['insurance', 'stats'] as const,
}

export function useInsurancePolicies(
  params: {
    page?: number
    perPage?: number
    property_id?: string
    status?: string
    type?: string
    search?: string
  } = {}
) {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.perPage) sp.set('per_page', String(params.perPage))
  if (params.property_id) sp.set('property_id', params.property_id)
  if (params.status) sp.set('status', params.status)
  if (params.type) sp.set('type', params.type)
  if (params.search) sp.set('search', params.search)

  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => api.get(`/api/insurance?${sp.toString()}`).then((r) => r.json()),
  })
}

export function useInsuranceStats() {
  return useQuery({
    queryKey: keys.stats(),
    queryFn: () => api.get('/api/insurance/stats').then((r) => r.json()),
  })
}

export function useCreateInsurancePolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/api/insurance', { json: data }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}

export function useUpdateInsurancePolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) =>
      api.put(`/api/insurance/${id}`, { json: data }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}

export function useDeleteInsurancePolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/insurance/${id}`).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}
