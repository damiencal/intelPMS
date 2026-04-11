import { createFileRoute } from '@tanstack/react-router'
import { OwnerStatements } from '@/features/owner-statements'

export const Route = createFileRoute('/_authenticated/owner-statements/')({
  component: OwnerStatements,
})
