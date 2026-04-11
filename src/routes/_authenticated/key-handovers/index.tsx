import { createFileRoute } from '@tanstack/react-router'
import KeyHandovers from '@/features/key-handovers'

export const Route = createFileRoute('/_authenticated/key-handovers/')({
  component: KeyHandovers,
})
