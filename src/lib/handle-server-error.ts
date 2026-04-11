import { toast } from 'sonner'
import { ApiError } from '@/lib/api'

export function handleServerError(error: unknown) {
  // eslint-disable-next-line no-console
  console.log(error)

  let errMsg = 'Something went wrong!'

  if (error instanceof ApiError) {
    const data = error.data as Record<string, string> | undefined
    errMsg = data?.error || data?.message || `Error ${error.status}: ${error.statusText}`
  } else if (error instanceof Error) {
    errMsg = error.message
  }

  toast.error(errMsg)
}
