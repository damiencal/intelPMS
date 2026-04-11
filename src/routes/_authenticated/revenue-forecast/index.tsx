import { createFileRoute } from '@tanstack/react-router'
import RevenueForecast from '@/features/revenue-forecast'

export const Route = createFileRoute('/_authenticated/revenue-forecast/')({
  component: RevenueForecast,
})
