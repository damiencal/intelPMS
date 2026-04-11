import { createFileRoute } from '@tanstack/react-router'
import { PricingRules } from '@/features/pricing'

export const Route = createFileRoute('/_authenticated/pricing/rules')({
  component: PricingRules,
})
