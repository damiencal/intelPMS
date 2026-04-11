import { createFileRoute } from '@tanstack/react-router'
import PricingRecommendationsPage from '@/features/pricing-recommendations'

export const Route = createFileRoute('/_authenticated/pricing-recommendations/')({
  component: PricingRecommendationsPage,
})
