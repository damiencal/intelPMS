import { createFileRoute } from '@tanstack/react-router'
import { Cleaning } from '@/features/cleaning'

export const Route = createFileRoute('/_authenticated/cleaning/')({
  component: Cleaning,
})
