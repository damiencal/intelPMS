import { createFileRoute } from '@tanstack/react-router'
import RateParity from '@/features/rate-parity'

export const Route = createFileRoute('/_authenticated/rate-parity/')({
  component: RateParity,
})
