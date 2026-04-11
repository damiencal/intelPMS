import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface ChannelSyncLog {
  id: string
  organizationId: string
  propertyId: string
  channel: string
  syncType: string
  status: string
  recordsSynced: number
  errors: string[] | null
  startedAt: string
  completedAt: string | null
  duration: number | null
  details: string | null
  createdAt: string
  updatedAt: string
  property?: { id: string; name: string }
}

export interface ChannelSyncStatusSummary {
  totalSyncs: number
  recentSyncs24h: number
  failedRecent24h: number
  avgDurationMs: number
}

export interface ChannelSyncStatusMatrixItem {
  propertyId: string
  propertyName: string
  channels: Record<
    string,
    {
      lastSync: string | null
      status: string
      syncTypes: Record<string, { status: string; lastSync: string | null }>
    }
  >
}

export const CHANNELS = [
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'booking', label: 'Booking.com' },
  { value: 'vrbo', label: 'VRBO' },
  { value: 'expedia', label: 'Expedia' },
]

export const SYNC_TYPES = [
  { value: 'availability', label: 'Availability' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'reservations', label: 'Reservations' },
  { value: 'content', label: 'Content' },
]

export const SYNC_STATUS = [
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
  { value: 'partial', label: 'Partial' },
  { value: 'in_progress', label: 'In Progress' },
]

const keys = {
  all: ['channel-sync'] as const,
  list: (p: Record<string, unknown>) => ['channel-sync', 'list', p] as const,
  status: () => ['channel-sync', 'status'] as const,
}

export function useChannelSyncLogs(
  params: {
    page?: number
    perPage?: number
    property_id?: string
    channel?: string
    status?: string
    sync_type?: string
  } = {}
) {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.perPage) sp.set('per_page', String(params.perPage))
  if (params.property_id) sp.set('property_id', params.property_id)
  if (params.channel) sp.set('channel', params.channel)
  if (params.status) sp.set('status', params.status)
  if (params.sync_type) sp.set('sync_type', params.sync_type)

  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => api.get(`/channel-sync?${sp.toString()}`),
  })
}

export function useChannelSyncStatus() {
  return useQuery({
    queryKey: keys.status(),
    queryFn: () => api.get('/channel-sync/status'),
  })
}

export function useCreateChannelSyncLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/channel-sync', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}

export function useUpdateChannelSyncLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) =>
      api.put(`/channel-sync/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}

export function useDeleteChannelSyncLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/channel-sync/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}
