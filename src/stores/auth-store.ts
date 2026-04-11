import { create } from 'zustand'
import type { AuthUser } from '@/hooks/use-auth'

/**
 * Lightweight Zustand store that mirrors the server session.
 * The source of truth is the HTTP-only session cookie managed by
 * the Hono backend.  React Query (useAuth) fetches the user and
 * writes it here so that non-React code can read it synchronously.
 */

interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    reset: () => void
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  auth: {
    user: null,
    setUser: (user) =>
      set((state) => ({ ...state, auth: { ...state.auth, user } })),
    reset: () =>
      set((state) => ({
        ...state,
        auth: { ...state.auth, user: null },
      })),
  },
}))
