import { createFileRoute } from '@tanstack/react-router'
import { MessagingTemplates } from '@/features/messaging'

export const Route = createFileRoute('/_authenticated/messaging/')({
  component: MessagingTemplates,
})
