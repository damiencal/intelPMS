import { useState } from 'react'
import {
  DollarSign,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  Receipt,
  RefreshCw,
  BadgeDollarSign,
  ShieldCheck,
  ShieldHalf,
  Plug,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  useExpenses,
  useExpenseSummary,
  useDeleteExpense,
  EXPENSE_CATEGORIES,
  type Expense,
} from './api'
import { ExpenseDialog } from './components/expense-dialog'

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function categoryLabel(cat: string) {
  return EXPENSE_CATEGORIES.find((c) => c.value === cat)?.label ?? cat
}

function categoryColor(
  cat: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (cat) {
    case 'cleaning':
    case 'maintenance':
      return 'default'
    case 'utilities':
    case 'supplies':
      return 'secondary'
    case 'taxes':
    case 'insurance':
      return 'destructive'
    default:
      return 'outline'
  }
}

export function Expenses() {
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: expensesRes, isLoading } = useExpenses({
    page,
    perPage: 20,
    category: category || undefined,
  })
  const { data: summary } = useExpenseSummary(12)
  const deleteMut = useDeleteExpense()

  const expenses = expensesRes?.data ?? []
  const meta = expensesRes?.meta

  function handleEdit(expense: Expense) {
    setEditingExpense(expense)
    setDialogOpen(true)
  }

  function handleAdd() {
    setEditingExpense(null)
    setDialogOpen(true)
  }

  async function handleDelete() {
    if (!deletingId) return
    try {
      await deleteMut.mutateAsync(deletingId)
      toast.success('Expense deleted')
    } catch {
      toast.error('Failed to delete expense')
    }
    setDeletingId(null)
  }

  return (
    <>
      <Header>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
          <ConfigDrawer />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Expenses</h2>
            <p className='text-muted-foreground'>
              Track and manage property-related expenses.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <div className='flex items-center gap-1'>
              <Link to='/staff-payroll'>
                <Button variant='ghost' size='icon' className='h-8 w-8' title='Staff Payroll'>
                  <BadgeDollarSign size={16} />
                </Button>
              </Link>
              <Link to='/security-deposits'>
                <Button variant='ghost' size='icon' className='h-8 w-8' title='Security Deposits'>
                  <ShieldCheck size={16} />
                </Button>
              </Link>
              <Link to='/insurance'>
                <Button variant='ghost' size='icon' className='h-8 w-8' title='Insurance'>
                  <ShieldHalf size={16} />
                </Button>
              </Link>
              <Link to='/utilities'>
                <Button variant='ghost' size='icon' className='h-8 w-8' title='Utilities'>
                  <Plug size={16} />
                </Button>
              </Link>
            </div>
            <Button onClick={handleAdd}>
              <Plus className='mr-2 h-4 w-4' /> Add Expense
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total (12 mo)</CardTitle>
              <DollarSign className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {summary ? formatCurrency(summary.total) : '—'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>This Month</CardTitle>
              <TrendingUp className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {summary?.monthly.length
                  ? formatCurrency(summary.monthly[summary.monthly.length - 1]?.amount ?? 0)
                  : '—'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Top Category</CardTitle>
              <Receipt className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {summary?.byCategory[0]
                  ? categoryLabel(summary.byCategory[0].category)
                  : '—'}
              </div>
              {summary?.byCategory[0] && (
                <p className='text-xs text-muted-foreground'>
                  {formatCurrency(summary.byCategory[0].amount)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Records</CardTitle>
              <Receipt className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{meta?.total ?? 0}</div>
              {meta?.totalAmount != null && meta.totalAmount > 0 && (
                <p className='text-xs text-muted-foreground'>
                  Filtered total: {formatCurrency(meta.totalAmount)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className='mt-4 flex items-center gap-4'>
          <Select value={category} onValueChange={(v) => { setCategory(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='All categories' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All categories</SelectItem>
              {EXPENSE_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className='flex justify-center py-20'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : expenses.length === 0 ? (
          <Card className='mt-4'>
            <CardContent className='flex flex-col items-center justify-center py-16'>
              <DollarSign className='mb-4 h-12 w-12 text-muted-foreground' />
              <CardTitle className='mb-2'>No expenses recorded</CardTitle>
              <CardDescription>Start tracking your property expenses.</CardDescription>
              <Button className='mt-4' onClick={handleAdd}>
                <Plus className='mr-2 h-4 w-4' /> Add Expense
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className='mt-4'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead className='text-right'>Amount</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className='w-[80px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className='whitespace-nowrap'>{formatDate(e.date)}</TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        {e.description}
                        {e.recurring && (
                          <RefreshCw className='h-3 w-3 text-muted-foreground' aria-label='Recurring' />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={categoryColor(e.category)}>{categoryLabel(e.category)}</Badge>
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {e.property?.name ?? '—'}
                    </TableCell>
                    <TableCell className='text-right font-medium'>
                      {formatCurrency(e.amount, e.currency)}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>{e.vendor ?? '—'}</TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1'>
                        <Button variant='ghost' size='icon' className='h-7 w-7' onClick={() => handleEdit(e)}>
                          <Pencil className='h-3.5 w-3.5' />
                        </Button>
                        <Button variant='ghost' size='icon' className='h-7 w-7 text-destructive' onClick={() => setDeletingId(e.id)}>
                          <Trash2 className='h-3.5 w-3.5' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className='flex items-center justify-between border-t px-4 py-3'>
                <p className='text-sm text-muted-foreground'>
                  Page {meta.page} of {meta.totalPages} ({meta.total} total)
                </p>
                <div className='flex gap-2'>
                  <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    Previous
                  </Button>
                  <Button variant='outline' size='sm' disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </Main>

      <ExpenseDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditingExpense(null) }}
        expense={editingExpense}
      />

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(o) => { if (!o) setDeletingId(null) }}
        title='Delete Expense'
        desc='Are you sure you want to delete this expense? This action cannot be undone.'
        handleConfirm={handleDelete}
        isLoading={deleteMut.isPending}
      />
    </>
  )
}
