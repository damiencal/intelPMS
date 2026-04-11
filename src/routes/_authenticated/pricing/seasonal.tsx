import { createFileRoute } from '@tanstack/react-router'
import { SeasonalStrategies } from '@/features/pricing'

export const Route = createFileRoute('/_authenticated/pricing/seasonal')({
  component: SeasonalStrategies,
})
