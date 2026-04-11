import { useState } from 'react'
import {
  Calendar,
  Clock,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users2,
  CheckCircle2,
  XCircle,
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
  useTeamShifts,
  useTeamShiftStats,
  useCreateTeamShift,
  useUpdateTeamShift,
  useDeleteTeamShift,
  SHIFT_TYPES,
  SHIFT_STATUSES,
  type TeamShift,
} from './api'
import { ShiftDialog } from './components/shift-dialog'

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  no_show: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

const typeColors: Record<string, string> = {
  cleaning: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  maintenance: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  check_in: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  check_out: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  inspection: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  general: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
}

export default function TeamShifts() {
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<TeamShift | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useTeamShifts({
    page,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
  })
  const { data: statsData } = useTeamShiftStats()
  const createMutation = useCreateTeamShift()
  const updateMutation = useUpdateTeamShift()
  const deleteMutation = useDeleteTeamShift()

  const items: TeamShift[] = data?.data ?? []
  const meta = data?.meta
  const stats = statsData?.data

  const handleSubmit = async (formData: Record<string, unknown>) => {
    try {
      if (editItem) {
        await updateMutation.mutateAsync({ id: editItem.id, ...formData })
        toast.success('Shift updated')
      } else {
        await createMutation.mutateAsync(formData)
        toast.success('Shift created')
      }
      setEditItem(null)
    } catch {
      toast.error('Operation failed')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Shift deleted')
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
            <h2 className='text-2xl font-bold tracking-tight'>Team Scheduling</h2>
            <p className='text-muted-foreground'>Manage staff shifts, assignments, and work hours.</p>
          </div>
          <Button onClick={() => { setEditItem(null); setDialogOpen(true) }}>
            <Plus className='mr-2 h-4 w-4' /> Create Shift
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className='mb-6 grid gap-4 sm:grid-cols-4'>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Total Shifts</CardDescription>
                <CardTitle className='text-2xl'>{stats.total}</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar className='h-4 w-4 text-muted-foreground' />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>This Week</CardDescription>
                <CardTitle className='text-2xl text-blue-600'>{stats.thisWeek}</CardTitle>
              </CardHeader>
              <CardContent>
                <Clock className='h-4 w-4 text-blue-500' />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Completed</CardDescription>
                <CardTitle className='text-2xl text-green-600'>{stats.completed}</CardTitle>
              </CardHeader>
              <CardContent>
                <CheckCircle2 className='h-4 w-4 text-green-500' />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Team Members</CardDescription>
                <CardTitle className='text-2xl'>{stats.uniqueAssignees}</CardTitle>
              </CardHeader>
              <CardContent>
                <Users2 className='h-4 w-4 text-muted-foreground' />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className='mb-4 flex gap-3'>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-[160px]'>
              <SelectValue placeholder='All Types' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Types</SelectItem>
              {SHIFT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-[160px]'>
              <SelectValue placeholder='All Statuses' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Statuses</SelectItem>
              {SHIFT_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
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
                  <TableHead>Assignee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead className='w-[50px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className='text-center text-muted-foreground py-8'>
                      No shifts found. Create your first shift.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className='font-medium'>{item.assignee}</TableCell>
                      <TableCell>
                        {new Date(item.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className='text-sm'>
                        {item.startTime} - {item.endTime}
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline' className={typeColors[item.type] ?? ''}>
                          {SHIFT_TYPES.find((t) => t.value === item.type)?.label ?? item.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.property?.name ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant='outline' className={statusColors[item.status] ?? ''}>
                          {SHIFT_STATUSES.find((s) => s.value === item.status)?.label ?? item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.hoursWorked ?? '—'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon'>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem onClick={() => { setEditItem(item); setDialogOpen(true) }}>
                              <Pencil className='mr-2 h-4 w-4' /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className='text-destructive' onClick={() => setDeleteId(item.id)}>
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
              Page {meta.page} of {meta.totalPages} ({meta.total} shifts)
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
      </Main>

      <ShiftDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editItem}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title='Delete Shift?'
        description='This will permanently remove this shift.'
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
