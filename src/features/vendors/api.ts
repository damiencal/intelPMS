import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Vendor {
  id: string
  organizationId: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  specialty: string
  rating: number | null
  hourlyRate: number | null
  currency: string
  address: string | null
  notes: string | null
  isActive: boolean
  totalJobs: number
  totalPaid: number
  createdAt: string
  updatedAt: string
}

export interface VendorStats {
  total: number
  active: number
  inactive: number
  bySpecialty: { specialty: string; count: number }[]
}

export const SPECIALTIES = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'general', label: 'General' },
  { value: 'painting', label: 'Painting' },
  { value: 'locksmith', label: 'Locksmith' },
  { value: 'pest_control', label: 'Pest Control' },
  { value: 'other', label: 'Other' },
]

const vendorKeys = {
  all: ['vendors'] as const,
  list: (p: Record<string, unknown>) => ['vendors', 'list', p] as const,
  stats: ['vendors', 'stats'] as const,
}

export function useVendors(params: {
  page?: number
  perPage?: number
  specialty?: string
  active?: string
  search?: string
} = {}) {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.perPage) sp.set('per_page', String(params.perPage))
  if (params.specialty) sp.set('specialty', params.specialty)
  if (params.active) sp.set('active', params.active)
  if (params.search) sp.set('search', params.search)

  return useQuery({
    queryKey: vendorKeys.list(params),
    queryFn: () =>
      api.get<{
        data: Vendor[]
        meta: { total: number; page: number; perPage: number; totalPages: number }
      }>(`/vendors?${sp}`),
  })
}

export function useVendorStats() {
  return useQuery({
    queryKey: vendorKeys.stats,
    queryFn: () => api.get<{ data: VendorStats }>('/vendors/stats'),
    select: (res) => res.data,
  })
}

export function useCreateVendor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Vendor>) =>
      api.post<{ data: Vendor }>('/vendors', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: vendorKeys.all }) },
  })
}

export function useUpdateVendor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Vendor> & { id: string }) =>
      api.put<{ data: Vendor }>(`/vendors/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: vendorKeys.all }) },
  })
}

export function useDeleteVendor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/vendors/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: vendorKeys.all }) },
  })
}
