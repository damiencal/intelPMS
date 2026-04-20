import { useState } from 'react'
import {
  DollarSign,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Shield,
  ShieldAlert,
  Trash2,
} from 'lucide-react'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  useSecurityDeposits,
  useDepositStats,
  useCreateDeposit,
  useUpdateDeposit,
  useDeleteDeposit,
  DEPOSIT_STATUSES,
  type SecurityDeposit,
} from './api'
import { DepositDialog } from './components/deposit-dialog'

const statusColors: Record<string, string> = {
  held: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  partially_refunded: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  refunded: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  claimed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  disputed: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
}

export default function SecurityDepositsPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<SecurityDeposit | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useSecurityDeposits({
    page,
    status: statusFilter || undefined,
    search: searchQuery || undefined,
  })
  const { data: statsData } = useDepositStats()
  const createMutation = useCreateDeposit()
  const updateMutation = useUpdateDeposit()
  const deleteMutation = useDeleteDeposit()

  const items: SecurityDeposit[] = data?.data ?? []
  const meta = data?.meta
  const stats = statsData?.data
  const properties = data?.properties ?? []

  const handleSubmit = async (formData: Record<string, unknown>) => {
    try {
      if (editItem) {
        await updateMutation.mutateAsync({ id: editItem.id, ...formData })
        toast.success('Deposit updated')
      } else {
        await createMutation.mutateAsync(formData)
        toast.success('Deposit recorded')
      }
      setDialogOpen(false)
      setEditItem(null)
    } catch {
      toast.error('Operation failed')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Deposit deleted')
      setDeleteId(null)
    } catch {
      toast.error('Failed to delete')
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
        <div className='mb-2 flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Security Deposits</h2>
            <p className='text-muted-foreground'>
              Track deposit collections, refunds, and damage claims.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditItem(null)
              setDialogOpen(true)
            }}
          >
            <Plus className='mr-2 h-4 w-4' /> Record Deposit
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className='mb-6 grid gap-4 sm:grid-cols-4'>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Currently Held</CardDescription>
                <CardTitle className='text-2xl text-blue-600'>
                  {formatCurrency(stats.totalHeld)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-xs text-muted-foreground'>{stats.held} deposits</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Total Refunded</CardDescription>
                <CardTitle className='text-2xl text-green-600'>
                  {formatCurrency(stats.totalRefunded)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Shield className='h-4 w-4 text-green-500' />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Total Claimed</CardDescription>
                <CardTitle className='text-2xl text-red-600'>
                  {formatCurrency(stats.totalClaimed)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ShieldAlert className='h-4 w-4 text-red-500' />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Disputed</CardDescription>
                <CardTitle className='text-2xl text-orange-600'>{stats.disputed}</CardTitle>
              </CardHeader>
              <CardContent>
                <DollarSign className='h-4 w-4 text-orange-500' />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className='mb-4 flex gap-3'>
          <Input
            placeholder='Search guest or reservation...'
            className='w-[250px]'
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v === 'all' ? '' : v)
              setPage(1)
            }}
          >
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='All Statuses' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Statuses</SelectItem>
              {DEPOSIT_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className='flex justify-center py-12'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : (
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead className='text-right'>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Collected</TableHead>
                  <TableHead className='text-right'>Refunded</TableHead>
                  <TableHead className='w-[50px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className='text-center text-muted-foreground py-8'>
                      No deposits found. Record your first security deposit.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className='font-medium'>
                        {item.guestName}
                        {item.reservationId && (
                          <p className='text-xs text-muted-foreground'>{item.reservationId}</p>
                        )}
                      </TableCell>
                      <TableCell>{item.property?.name ?? '—'}</TableCell>
                      <TableCell className='text-right font-medium'>
                        {formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline' className={statusColors[item.status] ?? ''}>
                          {DEPOSIT_STATUSES.find((s) => s.value === item.status)?.label ??
                            item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {new Date(item.collectedDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className='text-right'>
                        {item.refundAmount ? formatCurrency(item.refundAmount) : '—'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon'>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditItem(item)
                                setDialogOpen(true)
                              }}
                            >
                              <Pencil className='mr-2 h-4 w-4' /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className='text-destructive'
                              onClick={() => setDeleteId(item.id)}
                            >
                              <Trash2 className='mr-2 h-4 w-4' /> Delete
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
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className='mt-4 flex items-center justify-between'>
            <p className='text-sm text-muted-foreground'>
              Page {meta.page} of {meta.totalPages} ({meta.total} deposits)
            </p>
            <div className='flex gap-2'>
              <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={page >= meta.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Main>

      <DepositDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editItem}
        properties={properties}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title='Delete Deposit?'
        desc='This will permanently remove this security deposit record.'
        handleConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
