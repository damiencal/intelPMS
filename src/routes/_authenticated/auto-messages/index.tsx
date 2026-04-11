import { createFileRoute } from '@tanstack/react-router'
import { AutoMessages } from '@/features/auto-messages'

export const Route = createFileRoute('/_authenticated/auto-messages/')({
  component: AutoMessages,
})
