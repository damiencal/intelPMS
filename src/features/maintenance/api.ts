import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ---- Types ----

export interface MaintenanceRequest {
  id: string
  organizationId: string
  propertyId: string
  property: { id: string; name: string } | null
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'waiting_parts' | 'completed' | 'cancelled'
  category: string | null
  assignee: string | null
  estimatedCost: number | null
  actualCost: number | null
  scheduledDate: string | null
  completedDate: string | null
  photos: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface MaintenanceStats {
  open: number
  inProgress: number
  completed: number
  urgent: number
}

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent'
export type MaintenanceStatus = 'open' | 'in_progress' | 'waiting_parts' | 'completed' | 'cancelled'

export const PRIORITIES: { value: MaintenancePriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export const STATUSES: { value: MaintenanceStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_parts', label: 'Waiting Parts' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const MAINTENANCE_CATEGORIES = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'appliance', label: 'Appliance' },
  { value: 'structural', label: 'Structural' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'other', label: 'Other' },
]

// ---- Keys ----
const maintenanceKeys = {
  all: ['maintenance'] as const,
  list: (p: Record<string, unknown>) => ['maintenance', 'list', p] as const,
  stats: ['maintenance', 'stats'] as const,
}

// ---- Hooks ----

export function useMaintenanceRequests(params: {
  page?: number
  perPage?: number
  status?: string
  priority?: string
  propertyId?: string
} = {}) {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.perPage) sp.set('per_page', String(params.perPage))
  if (params.status) sp.set('status', params.status)
  if (params.priority) sp.set('priority', params.priority)
  if (params.propertyId) sp.set('property_id', params.propertyId)

  return useQuery({
    queryKey: maintenanceKeys.list(params),
    queryFn: () =>
      api.get<{
        data: MaintenanceRequest[]
        meta: { total: number; page: number; perPage: number; totalPages: number }
      }>(`/maintenance?${sp}`),
  })
}

export function useMaintenanceStats() {
  return useQuery({
    queryKey: maintenanceKeys.stats,
    queryFn: () => api.get<{ data: MaintenanceStats }>('/maintenance/stats'),
    select: (res) => res.data,
  })
}

export function useCreateMaintenance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      propertyId: string
      title: string
      description?: string
      priority?: string
      category?: string
      assignee?: string
      estimatedCost?: number
      scheduledDate?: string
    }) => api.post<{ data: MaintenanceRequest }>('/maintenance', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: maintenanceKeys.all })
    },
  })
}

export function useUpdateMaintenance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<{
      title: string
      description: string | null
      priority: string
      status: string
      category: string | null
      assignee: string | null
      estimatedCost: number | null
      actualCost: number | null
      scheduledDate: string | null
      completedDate: string | null
      photos: string[]
    }>) => api.put<{ data: MaintenanceRequest }>(`/maintenance/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: maintenanceKeys.all })
    },
  })
}

export function useDeleteMaintenance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/maintenance/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: maintenanceKeys.all })
    },
  })
}
