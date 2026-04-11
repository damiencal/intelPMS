import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface AppNotification {
  id: string
  organizationId: string
  userId: string | null
  type: string
  title: string
  message: string
  link: string | null
  isRead: boolean
  readAt: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

const notifKeys = {
  all: ['notifications'] as const,
  list: (p: Record<string, unknown>) => ['notifications', 'list', p] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
}

export function useNotifications(params: {
  page?: number
  perPage?: number
  unread?: boolean
} = {}) {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.perPage) sp.set('per_page', String(params.perPage))
  if (params.unread) sp.set('unread', 'true')

  return useQuery({
    queryKey: notifKeys.list(params),
    queryFn: () =>
      api.get<{
        data: AppNotification[]
        meta: { total: number; page: number; perPage: number; totalPages: number; unreadCount: number }
      }>(`/notifications?${sp}`),
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notifKeys.unreadCount,
    queryFn: () => api.get<{ data: { count: number } }>('/notifications/unread-count'),
    select: (res) => res.data.count,
    refetchInterval: 30_000, // poll every 30s
  })
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.put(`/notifications/${id}/read`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notifKeys.all })
    },
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.put('/notifications/mark-all-read', {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notifKeys.all })
    },
  })
}

export function useDeleteNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notifKeys.all })
    },
  })
}
