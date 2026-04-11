import { createFileRoute } from '@tanstack/react-router'
import TeamShifts from '@/features/team-shifts'

export const Route = createFileRoute('/_authenticated/team-shifts/')({
  component: TeamShifts,
})
