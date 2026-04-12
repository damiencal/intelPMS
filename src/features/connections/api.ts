import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ---- Types ----

export interface HostexConnection {
  id: string
  label: string
  authMethod: string
  isActive: boolean
  lastSyncAt: string | null
  syncStatus: string | null
  syncError: string | null
  createdAt: string
  _count: { properties: number }
}

interface ConnectionsResponse {
  data: HostexConnection[]
}

interface TestResult {
  success: boolean
  message: string
  properties?: number
}

// ---- Query keys ----

export const connectionKeys = {
  all: ['connections'] as const,
  detail: (id: string) => ['connections', id] as const,
}

// ---- Hooks ----

export function useConnections() {
  return useQuery({
    queryKey: connectionKeys.all,
    queryFn: () => api.get<ConnectionsResponse>('/connections'),
    select: (data) => data.data,
    refetchInterval: (query) => {
      const connections = query.state.data?.data
      const hasSyncing = connections?.some((c) => c.syncStatus === 'syncing')
      return hasSyncing ? 3000 : false
    },
  })
}

export function useCreateConnection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string; apiToken: string }) =>
      api.post('/connections', { label: payload.name, accessToken: payload.apiToken }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: connectionKeys.all })
    },
  })
}

export function useTestConnection(id: string) {
  return useQuery({
    queryKey: [...connectionKeys.detail(id), 'test'],
    queryFn: () => api.get<TestResult>(`/connections/${id}/test`),
    enabled: false, // manually triggered
  })
}

export function useSyncConnection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/connections/${id}/sync`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: connectionKeys.all })
    },
  })
}

export function useDeleteConnection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/connections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: connectionKeys.all })
    },
  })
}

// ============================================================
// Channex connections
// ============================================================

export interface ChannexConnection {
  id: string
  label: string
  isActive: boolean
  lastSyncAt: string | null
  syncStatus: string | null
  syncError: string | null
  webhookId: string | null
  createdAt: string
  _count: { channexProperties: number }
}

interface ChannexConnectionsResponse {
  data: ChannexConnection[]
}

export const channexConnectionKeys = {
  all: ['channex-connections'] as const,
  detail: (id: string) => ['channex-connections', id] as const,
  properties: (id: string) => ['channex-connections', id, 'properties'] as const,
  bookings: (id: string) => ['channex-connections', id, 'bookings'] as const,
}

export function useChannexConnections() {
  return useQuery({
    queryKey: channexConnectionKeys.all,
    queryFn: () => api.get<ChannexConnectionsResponse>('/channex-connections'),
    select: (data) => data.data,
    refetchInterval: (query) => {
      const connections = query.state.data?.data
      const hasSyncing = connections?.some((c) => c.syncStatus === 'syncing')
      return hasSyncing ? 3000 : false
    },
  })
}

export function useCreateChannexConnection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { label: string; apiKey: string }) =>
      api.post('/channex-connections', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channexConnectionKeys.all })
    },
  })
}

export function useSyncChannexConnection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/channex-connections/${id}/sync`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channexConnectionKeys.all })
    },
  })
}

export function useDeleteChannexConnection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/channex-connections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channexConnectionKeys.all })
    },
  })
}
