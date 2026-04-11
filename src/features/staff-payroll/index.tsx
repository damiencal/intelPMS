import { useState } from 'react'
import {
  DollarSign,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  type StaffPayroll,
  PAYROLL_ROLES,
  PAY_TYPES,
  PAYROLL_STATUS,
  useCreateStaffPayroll,
  useDeleteStaffPayroll,
  useStaffPayroll,
  useStaffPayrollStats,
  useUpdateStaffPayroll,
} from './api'
import { PayrollDialog } from './components/payroll-dialog'

export default function StaffPayrollPage() {
  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [payTypeFilter, setPayTypeFilter] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<StaffPayroll | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: listRes, isLoading } = useStaffPayroll({
    page,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
    pay_type: payTypeFilter || undefined,
  })
  const { data: statsRes } = useStaffPayrollStats()

  const createMutation = useCreateStaffPayroll()
  const updateMutation = useUpdateStaffPayroll()
  const deleteMutation = useDeleteStaffPayroll()

  const records: StaffPayroll[] = listRes?.data ?? []
  const meta = listRes?.meta
  const stats = statsRes?.data

  const handleCreate = (values: Record<string, unknown>) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Payroll entry created')
        setDialogOpen(false)
      },
      onError: () => toast.error('Failed to create payroll entry'),
    })
  }

  const handleUpdate = (values: Record<string, unknown>) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Payroll entry updated')
        setEditRecord(null)
      },
      onError: () => toast.error('Failed to update payroll entry'),
    })
  }

  const handleDelete = () => {
    if (!deleteId) return
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success('Payroll entry deleted')
        setDeleteId(null)
      },
      onError: () => toast.error('Failed to delete payroll entry'),
    })
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className='bg-yellow-500 text-white'>Pending</Badge>
      case 'approved':
        return <Badge className='bg-blue-600 text-white'>Approved</Badge>
      case 'paid':
        return <Badge className='bg-green-600 text-white'>Paid</Badge>
      case 'cancelled':
        return <Badge variant='destructive'>Cancelled</Badge>
      default:
        return <Badge variant='outline'>{status}</Badge>
    }
  }

  return (
    <>
      <Header>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-4 flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Staff Payroll</h2>
            <p className='text-muted-foreground'>
              Track payroll, deductions, and payment status across your team.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' /> Add Entry
          </Button>
        </div>

        {stats && (
          <div className='mb-6 grid gap-4 md:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Team Members</CardTitle>
                <Users className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.uniqueStaff}</div>
                <p className='text-muted-foreground text-xs'>{stats.total} payroll entries</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Gross</CardTitle>
                <Receipt className='text-blue-500 h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{formatCurrency(stats.totalGross)}</div>
                <p className='text-muted-foreground text-xs'>Deductions {formatCurrency(stats.totalDeductions)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Net Payroll</CardTitle>
                <DollarSign className='text-green-500 h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{formatCurrency(stats.totalNet)}</div>
                <p className='text-muted-foreground text-xs'>Hours logged: {stats.totalHours}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Status Mix</CardTitle>
                <Badge variant='outline' className='h-5'>
                  Live
                </Badge>
              </CardHeader>
              <CardContent>
                <div className='text-sm'>Pending: {stats.pending}</div>
                <div className='text-sm'>Approved: {stats.approved}</div>
                <div className='text-sm'>Paid: {stats.paid}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className='mb-4 flex flex-wrap gap-3'>
          <Select
            value={roleFilter}
            onValueChange={(v) => {
              setRoleFilter(v === 'all' ? '' : v)
              setPage(1)
            }}
          >
            <SelectTrigger className='w-44'>
              <SelectValue placeholder='All Roles' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Roles</SelectItem>
              {PAYROLL_ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={payTypeFilter}
            onValueChange={(v) => {
              setPayTypeFilter(v === 'all' ? '' : v)
              setPage(1)
            }}
          >
            <SelectTrigger className='w-44'>
              <SelectValue placeholder='All Pay Types' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Pay Types</SelectItem>
              {PAY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v === 'all' ? '' : v)
              setPage(1)
            }}
          >
            <SelectTrigger className='w-40'>
              <SelectValue placeholder='All Statuses' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Statuses</SelectItem>
              {PAYROLL_STATUS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className='flex justify-center py-12'>
            <Loader2 className='h-8 w-8 animate-spin' />
          </div>
        ) : (
          <>
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Pay Type</TableHead>
                    <TableHead className='text-right'>Rate</TableHead>
                    <TableHead className='text-right'>Gross</TableHead>
                    <TableHead className='text-right'>Deductions</TableHead>
                    <TableHead className='text-right'>Net</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='w-10' />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className='py-8 text-center text-muted-foreground'>
                        No payroll entries yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className='font-medium'>
                          {row.staffName}
                          <span className='block text-xs text-muted-foreground'>
                            {row.staffEmail ?? 'No email'}
                          </span>
                        </TableCell>
                        <TableCell>{row.role}</TableCell>
                        <TableCell>{row.payType}</TableCell>
                        <TableCell className='text-right'>{formatCurrency(row.payRate)}</TableCell>
                        <TableCell className='text-right'>{formatCurrency(row.grossAmount)}</TableCell>
                        <TableCell className='text-right'>{formatCurrency(row.deductions)}</TableCell>
                        <TableCell className='text-right font-medium'>{formatCurrency(row.netAmount)}</TableCell>
                        <TableCell className='text-xs'>
                          {new Date(row.periodStart).toLocaleDateString()} -{' '}
                          {new Date(row.periodEnd).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(row.status)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='icon' className='h-8 w-8'>
                                <MoreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem onClick={() => setEditRecord(row)}>
                                <Pencil className='mr-2 h-4 w-4' />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className='text-destructive'
                                onClick={() => setDeleteId(row.id)}
                              >
                                <Trash2 className='mr-2 h-4 w-4' />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {meta && meta.totalPages > 1 && (
              <div className='mt-4 flex items-center justify-between'>
                <p className='text-sm text-muted-foreground'>
                  Page {meta.page} of {meta.totalPages} ({meta.total} total)
                </p>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={page >= meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Main>

      <PayrollDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
      />

      <PayrollDialog
        open={!!editRecord}
        onOpenChange={(o) => !o && setEditRecord(null)}
        onSubmit={handleUpdate}
        isLoading={updateMutation.isPending}
        defaultValues={editRecord}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title='Delete Payroll Entry'
        description='Are you sure you want to delete this payroll entry?'
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
