import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { api, ApiError } from '@/lib/api'

// ---- Types ----

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  organizationId: string
  organizationName: string
  organizationSlug: string
}

interface AuthResponse {
  user: AuthUser | null
}

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload {
  email: string
  password: string
  name: string
  organizationName: string
}

// ---- Query keys ----

export const authKeys = {
  me: ['auth', 'me'] as const,
}

// ---- Hooks ----

/**
 * Fetch current authenticated user via GET /api/auth/me.
 * Returns null if not authenticated (no session cookie).
 */
export function useAuth() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: async (): Promise<AuthUser | null> => {
      const data = await api.get<AuthResponse>('/auth/me')
      return data.user
    },
    staleTime: 5 * 60 * 1000, // 5 min
    retry: false,
  })
}

/**
 * Login mutation - POST /api/auth/login
 */
export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const data = await api.post<AuthResponse>('/auth/login', payload)
      return data.user!
    },
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me, user)
    },
  })
}

/**
 * Register mutation - POST /api/auth/register
 */
export function useRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const data = await api.post<AuthResponse>('/auth/register', payload)
      return data.user!
    },
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me, user)
    },
  })
}

/**
 * Logout mutation - POST /api/auth/logout
 */
export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout')
    },
    onSuccess: () => {
      queryClient.setQueryData(authKeys.me, null)
      queryClient.clear()
      navigate({ to: '/sign-in', replace: true })
    },
  })
}

/**
 * Check if the current user is authenticated.
 * Used in route guards.
 */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const data = await api.get<AuthResponse>('/auth/me')
    return data.user
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      return null
    }
    return null
  }
}
