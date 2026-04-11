import { createFileRoute } from '@tanstack/react-router'
import InsurancePage from '@/features/insurance'

export const Route = createFileRoute('/_authenticated/insurance/')({
  component: InsurancePage,
})
