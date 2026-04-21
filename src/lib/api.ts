/**
 * API client utilities for communicating with the Hono backend.
 * All requests go through the Vite proxy (/api -> localhost:3001).
 */

const BASE = '/api'

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`${status} ${statusText}`)
    this.name = 'ApiError'
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let data: unknown
    try {
      data = await res.json()
    } catch {
      // ignore
    }
    throw new ApiError(res.status, res.statusText, data)
  }
  return res.json() as Promise<T>
}

export const api = {
  get<T = any>(path: string): Promise<T> {
    return fetch(`${BASE}${path}`, {
      credentials: 'include',
    }).then((r) => handleResponse<T>(r))
  },

  post<T = any>(path: string, body?: unknown): Promise<T> {
    return fetch(`${BASE}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }).then((r) => handleResponse<T>(r))
  },

  patch<T = any>(path: string, body?: unknown): Promise<T> {
    return fetch(`${BASE}${path}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }).then((r) => handleResponse<T>(r))
  },

  put<T = any>(path: string, body?: unknown): Promise<T> {
    return fetch(`${BASE}${path}`, {
      method: 'PUT',
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }).then((r) => handleResponse<T>(r))
  },

  delete<T = any>(path: string): Promise<T> {
    return fetch(`${BASE}${path}`, {
      method: 'DELETE',
      credentials: 'include',
    }).then((r) => handleResponse<T>(r))
  },
}
