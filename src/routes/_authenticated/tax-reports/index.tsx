import { createFileRoute } from '@tanstack/react-router'
import TaxReports from '@/features/tax-reports'

export const Route = createFileRoute('/_authenticated/tax-reports/')({
  component: TaxReports,
})
