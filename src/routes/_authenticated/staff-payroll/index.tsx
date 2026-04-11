import { createFileRoute } from '@tanstack/react-router'
import StaffPayrollPage from '@/features/staff-payroll'

export const Route = createFileRoute('/_authenticated/staff-payroll/')({
  component: StaffPayrollPage,
})
