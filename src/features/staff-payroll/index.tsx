import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
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

const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  pending: {
    label: 'Pending',
    className: 'px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/[0.08] text-amber-700',
    dot: 'bg-amber-500',
  },
  approved: {
    label: 'Approved',
    className: 'px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/[0.08] text-blue-700',
    dot: 'bg-blue-500',
  },
  paid: {
    label: 'Paid',
    className: 'px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/[0.08] text-emerald-700',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/[0.08] text-red-600',
    dot: 'bg-red-500',
  },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    className: 'px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500',
    dot: 'bg-gray-400',
  }
  return (
    <span className={cfg.className}>
      {cfg.label}
    </span>
  )
}

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

  const fmt = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)

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
        {/* Page header */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6'>
          <div>
            <h2 className='text-2xl font-semibold tracking-tight text-gray-900'>Staff Payroll</h2>
            <p className='text-sm text-gray-500 mt-0.5'>
              Track payroll, deductions, and payment status across your team.
            </p>
          </div>
          <div className='flex items-center gap-2 flex-wrap'>
            <button
              onClick={() => setDialogOpen(true)}
              className='px-4 py-2 bg-gray-900 hover:bg-gray-900/90 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
            >
              <Plus className='h-4 w-4' />
              Add Entry
            </button>
          </div>
        </div>

        {/* Stat cards */}
        {stats ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mb-6'>
            {/* Team Members */}
            <div className='glass-card rounded-2xl p-5'>
              <div className='flex items-center justify-between mb-4'>
                <span className='text-sm text-gray-500'>Team Members</span>
                <div className='p-2 bg-purple-50 rounded-lg'>
                  <Users className='w-4 h-4 text-purple-500' />
                </div>
              </div>
              <div className='text-2xl font-bold text-gray-900 tracking-tight'>{stats.uniqueStaff}</div>
              <div className='text-xs text-gray-400 mt-1'>{stats.total} payroll entries</div>
            </div>

            {/* Gross */}
            <div className='glass-card rounded-2xl p-5'>
              <div className='flex items-center justify-between mb-4'>
                <span className='text-sm text-gray-500'>Gross</span>
                <div className='p-2 bg-blue-50 rounded-lg'>
                  <Receipt className='w-4 h-4 text-blue-500' />
                </div>
              </div>
              <div className='text-2xl font-bold text-gray-900 tracking-tight'>{fmt(stats.totalGross)}</div>
              <div className='text-xs text-gray-400 mt-1'>Deductions {fmt(stats.totalDeductions)}</div>
            </div>

            {/* Net Payroll */}
            <div className='glass-card rounded-2xl p-5'>
              <div className='flex items-center justify-between mb-4'>
                <span className='text-sm text-gray-500'>Net Payroll</span>
                <div className='p-2 bg-emerald-50 rounded-lg'>
                  <DollarSign className='w-4 h-4 text-emerald-500' />
                </div>
              </div>
              <div className='text-2xl font-bold text-gray-900 tracking-tight'>{fmt(stats.totalNet)}</div>
              <div className='text-xs text-gray-400 mt-1'>Hours logged: {stats.totalHours}</div>
            </div>

            {/* Status Mix */}
            <div className='glass-card rounded-2xl p-5'>
              <div className='flex items-center justify-between mb-4'>
                <span className='text-sm text-gray-500'>Status Mix</span>
                <span className='px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/[0.08] text-emerald-700'>
                  Live
                </span>
              </div>
              <div className='space-y-1.5'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-500'>Pending</span>
                  <span className='font-semibold text-gray-900'>{stats.pending}</span>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-500'>Approved</span>
                  <span className='font-semibold text-gray-900'>{stats.approved}</span>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-500'>Paid</span>
                  <span className='font-semibold text-gray-900'>{stats.paid}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mb-6'>
            {[...Array(4)].map((_, i) => (
              <div key={i} className='glass-card rounded-2xl p-5 animate-pulse h-32' />
            ))}
          </div>
        )}

        {/* Filters */}
        <div className='flex flex-wrap gap-3 mb-5'>
          <Select
            value={roleFilter}
            onValueChange={(v) => { setRoleFilter(v === 'all' ? '' : v); setPage(1) }}
          >
            <SelectTrigger className='w-44 border-black/[0.08] rounded-xl text-sm focus:ring-2 focus:ring-black/[0.15]'>
              <SelectValue placeholder='All Roles' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Roles</SelectItem>
              {PAYROLL_ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={payTypeFilter}
            onValueChange={(v) => { setPayTypeFilter(v === 'all' ? '' : v); setPage(1) }}
          >
            <SelectTrigger className='w-44 border-black/[0.08] rounded-xl text-sm focus:ring-2 focus:ring-black/[0.15]'>
              <SelectValue placeholder='All Pay Types' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Pay Types</SelectItem>
              {PAY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}
          >
            <SelectTrigger className='w-40 border-black/[0.08] rounded-xl text-sm focus:ring-2 focus:ring-black/[0.15]'>
              <SelectValue placeholder='All Statuses' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Statuses</SelectItem>
              {PAYROLL_STATUS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className='glass-card rounded-2xl p-16 flex items-center justify-center'>
            <Loader2 className='h-7 w-7 animate-spin text-gray-400' />
          </div>
        ) : (
          <>
            <div className='glass-card rounded-2xl overflow-hidden'>
              <table className='w-full'>
                <thead className='bg-gray-50 border-b border-gray-200'>
                  <tr>
                    <th scope='col' className='px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>Staff</th>
                    <th scope='col' className='px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>Role</th>
                    <th scope='col' className='px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>Pay Type</th>
                    <th scope='col' className='px-4 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>Rate</th>
                    <th scope='col' className='px-4 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>Gross</th>
                    <th scope='col' className='px-4 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>Deductions</th>
                    <th scope='col' className='px-4 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>Net</th>
                    <th scope='col' className='px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>Period</th>
                    <th scope='col' className='px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>Status</th>
                    <th scope='col' className='w-10' />
                  </tr>
                </thead>
                <tbody className='divide-y divide-black/[0.04]'>
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={10} className='px-4 py-16 text-center text-sm text-gray-400'>
                        No payroll entries yet.
                      </td>
                    </tr>
                  ) : (
                    records.map((row) => (
                      <tr
                        key={row.id}
                        className='hover:bg-gray-50/40 transition-colors'
                      >
                        <td className='px-4 py-3'>
                          <div className='text-sm font-medium text-gray-900'>{row.staffName}</div>
                          <div className='text-xs text-gray-400'>{row.staffEmail ?? 'No email'}</div>
                        </td>
                        <td className='px-4 py-3 text-sm text-gray-700'>{row.role}</td>
                        <td className='px-4 py-3 text-sm text-gray-700'>{row.payType}</td>
                        <td className='px-4 py-3 text-right font-mono text-xs text-gray-700'>{fmt(row.payRate)}</td>
                        <td className='px-4 py-3 text-right font-mono text-xs text-gray-700'>{fmt(row.grossAmount)}</td>
                        <td className='px-4 py-3 text-right font-mono text-xs text-gray-700'>{fmt(row.deductions)}</td>
                        <td className='px-4 py-3 text-right font-mono text-xs font-semibold text-gray-900'>{fmt(row.netAmount)}</td>
                        <td className='px-4 py-3 text-xs text-gray-500'>
                          {new Date(row.periodStart).toLocaleDateString()} –{' '}
                          {new Date(row.periodEnd).toLocaleDateString()}
                        </td>
                        <td className='px-4 py-3'>
                          <StatusBadge status={row.status} />
                        </td>
                        <td className='px-4 py-3'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className='p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-black/[0.15]'
                                aria-label='Row actions'
                              >
                                <MoreHorizontal className='h-4 w-4' />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem onClick={() => setEditRecord(row)}>
                                <Pencil className='mr-2 h-4 w-4' />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className='text-red-600'
                                onClick={() => setDeleteId(row.id)}
                              >
                                <Trash2 className='mr-2 h-4 w-4' />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className='mt-4 flex items-center justify-between'>
                <p className='text-sm text-gray-500'>
                  Page {meta.page} of {meta.totalPages} ({meta.total} total)
                </p>
                <div className='flex gap-2'>
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className='px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-black/[0.15]'
                  >
                    <ChevronLeft className='h-3.5 w-3.5' />
                    Previous
                  </button>
                  <button
                    disabled={page >= meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className='px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-black/[0.15]'
                  >
                    Next
                    <ChevronRight className='h-3.5 w-3.5' />
                  </button>
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
        desc='Are you sure you want to delete this payroll entry?'
        handleConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        destructive
      />
    </>
  )
}

