import { createFileRoute } from '@tanstack/react-router'
import SecurityDeposits from '@/features/security-deposits'

export const Route = createFileRoute('/_authenticated/security-deposits/')({
  component: SecurityDeposits,
})
