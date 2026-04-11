import { createFileRoute } from '@tanstack/react-router'
import { PricingProposals } from '@/features/pricing'

export const Route = createFileRoute('/_authenticated/pricing/proposals')({
  component: PricingProposals,
})
