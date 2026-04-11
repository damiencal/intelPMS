import { createFileRoute } from '@tanstack/react-router'
import CompetitorRatesPage from '@/features/competitor-rates'

export const Route = createFileRoute('/_authenticated/competitor-rates/')({
  component: CompetitorRatesPage,
})
