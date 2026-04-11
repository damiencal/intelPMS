import { useState } from 'react'
import {
  AlertCircle,
  DollarSign,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  Zap,
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
import { Input } from '@/components/ui/input'
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
  type UtilityBill,
  UTILITY_TYPES,
  BILL_STATUSES,
  useUtilityBills,
  useUtilityStats,
  useCreateUtilityBill,
  useUpdateUtilityBill,
  useDeleteUtilityBill,
} from './api'
import { BillDialog } from './components/bill-dialog'

export default function UtilitiesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editBill, setEditBill] = useState<UtilityBill | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: listRes, isLoading } = useUtilityBills({
    page,
    search: search || undefined,
    utility_type: typeFilter || undefined,
    status: statusFilter || undefined,
  })
  const { data: statsRes } = useUtilityStats()

  const createMutation = useCreateUtilityBill()
  const updateMutation = useUpdateUtilityBill()
  const deleteMutation = useDeleteUtilityBill()

  const bills: UtilityBill[] = listRes?.data ?? []
  const meta = listRes?.meta
  const stats = statsRes?.data

  const handleCreate = (values: Record<string, unknown>) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Bill added')
        setDialogOpen(false)
      },
      onError: () => toast.error('Failed to add bill'),
    })
  }

  const handleUpdate = (values: Record<string, unknown>) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Bill updated')
        setEditBill(null)
      },
      onError: () => toast.error('Failed to update bill'),
    })
  }

  const handleDelete = () => {
    if (!deleteId) return
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success('Bill deleted')
        setDeleteId(null)
      },
      onError: () => toast.error('Failed to delete'),
    })
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className='bg-green-600 text-white'>Paid</Badge>
      case 'pending':
        return <Badge className='bg-yellow-500 text-white'>Pending</Badge>
      case 'overdue':
        return <Badge variant='destructive'>Overdue</Badge>
      case 'disputed':
        return <Badge variant='secondary'>Disputed</Badge>
      default:
        return <Badge variant='outline'>{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    const t = UTILITY_TYPES.find((u) => u.value === type)
    return t?.icon ?? '📋'
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
            <h2 className='text-2xl font-bold tracking-tight'>Utility Cost Tracking</h2>
            <p className='text-muted-foreground'>
              Monitor utility bills across all properties.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' /> Add Bill
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className='mb-6 grid gap-4 md:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Total Bills</CardTitle>
                <Receipt className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{formatCurrency(stats.totalAmount)}</div>
                <p className='text-muted-foreground text-xs'>{stats.totalBills} bills</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Pending</CardTitle>
                <DollarSign className='text-yellow-500 h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{formatCurrency(stats.pendingAmount)}</div>
                <p className='text-muted-foreground text-xs'>{stats.pendingCount} bills</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Overdue</CardTitle>
                <AlertCircle className='text-red-500 h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{formatCurrency(stats.overdueAmount)}</div>
                <p className='text-muted-foreground text-xs'>{stats.overdueCount} bills</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>By Type</CardTitle>
                <Zap className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='flex flex-wrap gap-1.5'>
                  {Object.entries(stats.byType).map(([type, info]) => (
                    <span key={type} className='text-xs'>
                      {getTypeIcon(type)} {formatCurrency((info as any).total)}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Monthly Trend */}
        {stats?.monthlyTrend && stats.monthlyTrend.length > 0 && (
          <Card className='mb-6'>
            <CardHeader>
              <CardTitle className='text-sm font-medium'>Monthly Trend (12 months)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex h-24 items-end gap-1'>
                {stats.monthlyTrend.map((m: { month: string; amount: number }) => {
                  const max = Math.max(...stats.monthlyTrend.map((t: { amount: number }) => t.amount), 1)
                  const height = (m.amount / max) * 100
                  return (
                    <div key={m.month} className='flex flex-1 flex-col items-center gap-1'>
                      <div
                        className='bg-primary/80 w-full rounded-t'
                        style={{ height: `${height}%`, minHeight: m.amount > 0 ? '4px' : '0' }}
                        title={`${m.month}: ${formatCurrency(m.amount)}`}
                      />
                      <span className='text-[9px] text-muted-foreground truncate w-full text-center'>
                        {m.month.slice(5)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className='mb-4 flex flex-wrap gap-3'>
          <Input
            placeholder='Search providers...'
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className='w-64'
          />
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-40'>
              <SelectValue placeholder='All Types' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Types</SelectItem>
              {UTILITY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-36'>
              <SelectValue placeholder='All Statuses' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Statuses</SelectItem>
              {BILL_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
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
                    <TableHead>Property</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className='text-right'>Amount</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className='w-10' />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className='py-8 text-center text-muted-foreground'>
                        No utility bills yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className='font-medium'>
                          {bill.property?.name ?? '—'}
                        </TableCell>
                        <TableCell>
                          <span className='mr-1'>{getTypeIcon(bill.utilityType)}</span>
                          {UTILITY_TYPES.find((t) => t.value === bill.utilityType)?.label ?? bill.utilityType}
                        </TableCell>
                        <TableCell className='text-sm'>{bill.provider ?? '—'}</TableCell>
                        <TableCell className='text-xs'>
                          {new Date(bill.billingPeriodStart).toLocaleDateString()} →{' '}
                          {new Date(bill.billingPeriodEnd).toLocaleDateString()}
                        </TableCell>
                        <TableCell className='text-right font-medium'>
                          {formatCurrency(bill.amount)}
                        </TableCell>
                        <TableCell className='text-sm'>
                          {bill.usage != null ? (
                            <span>
                              {bill.usage} {bill.usageUnit || ''}
                            </span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(bill.status)}</TableCell>
                        <TableCell className='text-xs text-muted-foreground'>
                          {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='icon' className='h-8 w-8'>
                                <MoreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem onClick={() => setEditBill(bill)}>
                                <Pencil className='mr-2 h-4 w-4' />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className='text-destructive'
                                onClick={() => setDeleteId(bill.id)}
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

      <BillDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
      />

      <BillDialog
        open={!!editBill}
        onOpenChange={(o) => !o && setEditBill(null)}
        onSubmit={handleUpdate}
        isLoading={updateMutation.isPending}
        defaultValues={editBill}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title='Delete Bill'
        description='Are you sure you want to delete this utility bill?'
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
