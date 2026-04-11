import { useState } from 'react'
import {
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Pencil,
  Plus,
  SprayCan,
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
  useCleaningSchedules,
  useCleaningStats,
  useUpdateCleaning,
  useDeleteCleaning,
  CLEANING_TYPES,
  CLEANING_STATUSES,
  type CleaningSchedule,
} from './api'
import { CleaningDialog } from './components/cleaning-dialog'

function typeLabel(t: string) {
  return CLEANING_TYPES.find((x) => x.value === t)?.label ?? t
}

function statusLabel(s: string) {
  return CLEANING_STATUSES.find((x) => x.value === s)?.label ?? s
}

function statusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (s) {
    case 'completed': return 'default'
    case 'in_progress': return 'secondary'
    case 'skipped': return 'destructive'
    default: return 'outline'
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function Cleaning() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<CleaningSchedule | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: res, isLoading } = useCleaningSchedules({
    page,
    perPage: 20,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
  })
  const { data: stats } = useCleaningStats()
  const updateMut = useUpdateCleaning()
  const deleteMut = useDeleteCleaning()

  const schedules = res?.data ?? []
  const meta = res?.meta

  function handleAdd() { setEditingSchedule(null); setDialogOpen(true) }
  function handleEdit(s: CleaningSchedule) { setEditingSchedule(s); setDialogOpen(true) }

  async function handleStatusChange(id: string, status: string) {
    try {
      await updateMut.mutateAsync({ id, status })
      toast.success(`Status updated to ${statusLabel(status)}`)
    } catch { toast.error('Failed to update') }
  }

  async function handleDelete() {
    if (!deletingId) return
    try {
      await deleteMut.mutateAsync(deletingId)
      toast.success('Deleted')
    } catch { toast.error('Failed to delete') }
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
            <h2 className='text-2xl font-bold tracking-tight'>Cleaning Schedule</h2>
            <p className='text-muted-foreground'>Manage turnover and routine cleanings.</p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className='mr-2 h-4 w-4' /> Schedule Cleaning
          </Button>
        </div>

        {/* Stats */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Today</CardTitle>
              <CalendarCheck2 className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats?.today ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>This Week</CardTitle>
              <CalendarDays className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats?.thisWeek ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Pending</CardTitle>
              <Clock className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats?.pending ?? 0}</div>
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
        </div>

        {/* Filters */}
        <div className='mt-4 flex items-center gap-4'>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-[150px]'>
              <SelectValue placeholder='All statuses' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All statuses</SelectItem>
              {CLEANING_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-[150px]'>
              <SelectValue placeholder='All types' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All types</SelectItem>
              {CLEANING_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className='flex justify-center py-20'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : schedules.length === 0 ? (
          <Card className='mt-4'>
            <CardContent className='flex flex-col items-center justify-center py-16'>
              <SprayCan className='mb-4 h-12 w-12 text-muted-foreground' />
              <CardTitle className='mb-2'>No cleanings scheduled</CardTitle>
              <CardDescription>Schedule your first cleaning.</CardDescription>
              <Button className='mt-4' onClick={handleAdd}>
                <Plus className='mr-2 h-4 w-4' /> Schedule Cleaning
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className='mt-4'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Est. Hours</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className='w-[80px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className='whitespace-nowrap'>{formatDate(s.scheduledDate)}</TableCell>
                    <TableCell className='text-muted-foreground'>{s.property?.name ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant='outline'>{typeLabel(s.type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Select value={s.status} onValueChange={(v) => handleStatusChange(s.id, v)}>
                        <SelectTrigger className='h-7 w-[120px]'>
                          <Badge variant={statusVariant(s.status)} className='pointer-events-none'>
                            {statusLabel(s.status)}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {CLEANING_STATUSES.map((st) => (
                            <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className='text-muted-foreground'>{s.assignee || '—'}</TableCell>
                    <TableCell className='text-muted-foreground'>{s.estimatedHours ?? '—'}</TableCell>
                    <TableCell className='text-muted-foreground'>{s.scheduledTime ?? '—'}</TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1'>
                        <Button variant='ghost' size='icon' className='h-7 w-7' onClick={() => handleEdit(s)}>
                          <Pencil className='h-3.5 w-3.5' />
                        </Button>
                        <Button variant='ghost' size='icon' className='h-7 w-7 text-destructive' onClick={() => setDeletingId(s.id)}>
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
                  <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                  <Button variant='outline' size='sm' disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </Main>

      <CleaningDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditingSchedule(null) }}
        schedule={editingSchedule}
      />
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(o) => { if (!o) setDeletingId(null) }}
        title='Delete Cleaning'
        desc='Are you sure you want to delete this cleaning schedule?'
        handleConfirm={handleDelete}
        isLoading={deleteMut.isPending}
      />
    </>
  )
}
