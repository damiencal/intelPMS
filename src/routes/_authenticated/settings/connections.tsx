import { createFileRoute } from '@tanstack/react-router'
import { ConnectionManager } from '@/features/connections'

export const Route = createFileRoute('/_authenticated/settings/connections')({
  component: ConnectionManager,
})
