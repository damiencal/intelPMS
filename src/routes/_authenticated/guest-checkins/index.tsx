import { createFileRoute } from '@tanstack/react-router'
import { GuestCheckins } from '@/features/guest-checkins'

export const Route = createFileRoute('/_authenticated/guest-checkins/')({
  component: GuestCheckins,
})
