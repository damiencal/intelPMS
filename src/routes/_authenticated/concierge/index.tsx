import { createFileRoute } from '@tanstack/react-router'
import ConciergePage from '@/features/concierge'

export const Route = createFileRoute('/_authenticated/concierge/')({
  component: ConciergePage,
})
