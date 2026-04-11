import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface KeyHandover {
  id: string
  organizationId: string
  propertyId: string
  property: { id: string; name: string } | null
  keyType: string
  keyIdentifier: string
  assignedTo: string | null
  assignedDate: string | null
  returnedDate: string | null
  status: string
  notes: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface KeyHandoverStats {
  total: number
  available: number
  assigned: number
  lost: number
}

export const KEY_TYPES = [
  { value: 'physical', label: 'Physical Key' },
  { value: 'smart_lock', label: 'Smart Lock' },
  { value: 'keybox', label: 'Key Box' },
  { value: 'garage_opener', label: 'Garage Opener' },
  { value: 'gate_remote', label: 'Gate Remote' },
]

export const KEY_STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'returned', label: 'Returned' },
  { value: 'lost', label: 'Lost' },
  { value: 'deactivated', label: 'Deactivated' },
]

const keyKeys = {
  all: ['key-handovers'] as const,
  list: (p: Record<string, unknown>) => ['key-handovers', 'list', p] as const,
  stats: ['key-handovers', 'stats'] as const,
}

export function useKeyHandovers(params: {
  page?: number
  perPage?: number
  propertyId?: string
  status?: string
  keyType?: string
  search?: string
} = {}) {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.perPage) sp.set('per_page', String(params.perPage))
  if (params.propertyId) sp.set('property_id', params.propertyId)
  if (params.status) sp.set('status', params.status)
  if (params.keyType) sp.set('key_type', params.keyType)
  if (params.search) sp.set('search', params.search)

  return useQuery({
    queryKey: keyKeys.list(params),
    queryFn: () => api.get(`/api/key-handovers?${sp.toString()}`).then((r) => r.json()),
  })
}

export function useKeyHandoverStats() {
  return useQuery({
    queryKey: keyKeys.stats,
    queryFn: () => api.get('/api/key-handovers/stats').then((r) => r.json()),
  })
}

export function useCreateKeyHandover() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/api/key-handovers', { json: data }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keyKeys.all })
    },
  })
}

export function useUpdateKeyHandover() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown> & { id: string }) =>
      api.put(`/api/key-handovers/${id}`, { json: data }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keyKeys.all })
    },
  })
}

export function useDeleteKeyHandover() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/key-handovers/${id}`).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keyKeys.all })
    },
  })
}
