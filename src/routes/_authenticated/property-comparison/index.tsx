import { createFileRoute } from '@tanstack/react-router'
import PropertyComparison from '@/features/property-comparison'

export const Route = createFileRoute('/_authenticated/property-comparison/')({
  component: PropertyComparison,
})
