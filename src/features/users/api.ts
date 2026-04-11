import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ---- Types ----

export interface TeamMember {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

export interface CreateUserPayload {
  email: string
  name: string
  role: string
  password: string
}

export interface UpdateUserPayload {
  name?: string
  role?: string
}

// ---- Query keys ----

export const userKeys = {
  all: ['users'] as const,
  list: () => [...userKeys.all, 'list'] as const,
}

// ---- Hooks ----

export function useTeamMembers() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: () => api.get<{ data: TeamMember[] }>('/users'),
    select: (res) => res.data,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateUserPayload) =>
      api.post<{ data: TeamMember }>('/users', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateUserPayload & { id: string }) =>
      api.patch<{ data: TeamMember }>(`/users/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  })
}
