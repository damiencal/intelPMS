import { createFileRoute } from '@tanstack/react-router'
import UtilitiesPage from '@/features/utilities'

export const Route = createFileRoute('/_authenticated/utilities/')({
  component: UtilitiesPage,
})
