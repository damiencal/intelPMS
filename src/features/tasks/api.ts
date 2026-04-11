import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ---- Types ----

export interface TaskItem {
  id: string
  organizationId: string
  propertyId: string | null
  title: string
  description: string | null
  status: string
  priority: string
  label: string | null
  assigneeId: string | null
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTaskPayload {
  title: string
  description?: string
  status?: string
  priority?: string
  label?: string
  propertyId?: string
  assigneeId?: string
  dueDate?: string
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {}

interface TasksResponse {
  data: TaskItem[]
  meta: { total: number; page: number; perPage: number; totalPages: number }
}

// ---- Query keys ----

export const taskKeys = {
  all: ['tasks'] as const,
  list: (params?: Record<string, unknown>) => ['tasks', 'list', params] as const,
}

// ---- Hooks ----

export function useTasks(params: {
  page?: number
  perPage?: number
  status?: string
  priority?: string
  label?: string
  search?: string
} = {}) {
  const { page = 1, perPage = 50, status, priority, label, search } = params
  const searchParams = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  })
  if (status) searchParams.set('status', status)
  if (priority) searchParams.set('priority', priority)
  if (label) searchParams.set('label', label)
  if (search) searchParams.set('search', search)

  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => api.get<TasksResponse>(`/tasks?${searchParams}`),
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTaskPayload) =>
      api.post<{ data: TaskItem }>('/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateTaskPayload & { id: string }) =>
      api.patch<{ data: TaskItem }>(`/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<{ success: boolean }>(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useBulkDeleteTasks() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) =>
      api.post<{ deleted: number }>('/tasks/bulk-delete', { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}
