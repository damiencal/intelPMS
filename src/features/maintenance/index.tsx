import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Wrench,
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
  useMaintenanceRequests,
  useMaintenanceStats,
  useUpdateMaintenance,
  useDeleteMaintenance,
  STATUSES,
  PRIORITIES,
  type MaintenanceRequest,
} from './api'
import { MaintenanceDialog } from './components/maintenance-dialog'

function priorityVariant(
  p: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (p) {
    case 'urgent':
      return 'destructive'
    case 'high':
      return 'default'
    case 'medium':
      return 'secondary'
    default:
      return 'outline'
  }
}

function statusVariant(
  s: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (s) {
    case 'completed':
      return 'default'
    case 'in_progress':
      return 'secondary'
    case 'waiting_parts':
      return 'outline'
    case 'cancelled':
      return 'destructive'
    default:
      return 'outline'
  }
}

function statusLabel(s: string) {
  return STATUSES.find((x) => x.value === s)?.label ?? s
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function Maintenance() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: requestsRes, isLoading } = useMaintenanceRequests({
    page,
    perPage: 20,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
  })
  const { data: stats } = useMaintenanceStats()
  const updateMut = useUpdateMaintenance()
  const deleteMut = useDeleteMaintenance()

  const requests = requestsRes?.data ?? []
  const meta = requestsRes?.meta

  function handleAdd() {
    setEditingRequest(null)
    setDialogOpen(true)
  }

  function handleEdit(r: MaintenanceRequest) {
    setEditingRequest(r)
    setDialogOpen(true)
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      await updateMut.mutateAsync({ id, status })
      toast.success(`Status updated to ${statusLabel(status)}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  async function handleDelete() {
    if (!deletingId) return
    try {
      await deleteMut.mutateAsync(deletingId)
      toast.success('Request deleted')
    } catch {
      toast.error('Failed to delete')
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
            <h2 className='text-2xl font-bold tracking-tight'>Maintenance</h2>
            <p className='text-muted-foreground'>
              Track and manage property maintenance requests.
            </p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className='mr-2 h-4 w-4' /> New Request
          </Button>
        </div>

        {/* Stats Cards */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Open</CardTitle>
              <Clock className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats?.open ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>In Progress</CardTitle>
              <Wrench className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats?.inProgress ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Completed</CardTitle>
              <CheckCircle2 className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats?.completed ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Urgent</CardTitle>
              <AlertTriangle className='h-4 w-4 text-destructive' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-destructive'>{stats?.urgent ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className='mt-4 flex items-center gap-4'>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-[160px]'>
              <SelectValue placeholder='All statuses' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-[160px]'>
              <SelectValue placeholder='All priorities' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All priorities</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
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
        ) : requests.length === 0 ? (
          <Card className='mt-4'>
            <CardContent className='flex flex-col items-center justify-center py-16'>
              <Wrench className='mb-4 h-12 w-12 text-muted-foreground' />
              <CardTitle className='mb-2'>No maintenance requests</CardTitle>
              <CardDescription>Create your first maintenance request to get started.</CardDescription>
              <Button className='mt-4' onClick={handleAdd}>
                <Plus className='mr-2 h-4 w-4' /> New Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className='mt-4'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className='w-[100px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className='font-medium'>
                      {r.title}
                      {r.category && (
                        <span className='ml-2 text-xs text-muted-foreground'>({r.category})</span>
                      )}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {r.property?.name ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityVariant(r.priority)}>
                        {r.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={r.status}
                        onValueChange={(v) => handleStatusChange(r.id, v)}
                      >
                        <SelectTrigger className='h-7 w-[130px]'>
                          <Badge variant={statusVariant(r.status)} className='pointer-events-none'>
                            {statusLabel(r.status)}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {r.assignee || '—'}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {r.estimatedCost != null ? formatCurrency(r.estimatedCost) : '—'}
                      {r.actualCost != null && (
                        <span className='ml-1 text-xs'>
                          (actual: {formatCurrency(r.actualCost)})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className='whitespace-nowrap text-muted-foreground'>
                      {formatDate(r.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1'>
                        <Button variant='ghost' size='icon' className='h-7 w-7' onClick={() => handleEdit(r)}>
                          <Pencil className='h-3.5 w-3.5' />
                        </Button>
                        <Button variant='ghost' size='icon' className='h-7 w-7 text-destructive' onClick={() => setDeletingId(r.id)}>
                          <Trash2 className='h-3.5 w-3.5' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

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

      <MaintenanceDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditingRequest(null) }}
        request={editingRequest}
      />

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(o) => { if (!o) setDeletingId(null) }}
        title='Delete Request'
        desc='Are you sure you want to delete this maintenance request?'
        handleConfirm={handleDelete}
        isLoading={deleteMut.isPending}
      />
    </>
  )
}
