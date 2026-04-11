import { createFileRoute } from '@tanstack/react-router'
import GuestFeedback from '@/features/guest-feedback'

export const Route = createFileRoute('/_authenticated/guest-feedback/')({
  component: GuestFeedback,
})
