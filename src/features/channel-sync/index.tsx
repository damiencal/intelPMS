import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Trash2,
  XCircle,
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
  type ChannelSyncLog,
  CHANNELS,
  SYNC_STATUS,
  SYNC_TYPES,
  useChannelSyncLogs,
  useChannelSyncStatus,
  useCreateChannelSyncLog,
  useDeleteChannelSyncLog,
  useUpdateChannelSyncLog,
} from './api'
import { SyncLogDialog } from './components/sync-log-dialog'

export default function ChannelSyncPage() {
  const [page, setPage] = useState(1)
  const [channelFilter, setChannelFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<ChannelSyncLog | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: listRes, isLoading } = useChannelSyncLogs({
    page,
    channel: channelFilter || undefined,
    status: statusFilter || undefined,
    sync_type: typeFilter || undefined,
  })
  const { data: statusRes } = useChannelSyncStatus()

  const createMutation = useCreateChannelSyncLog()
  const updateMutation = useUpdateChannelSyncLog()
  const deleteMutation = useDeleteChannelSyncLog()

  const logs: ChannelSyncLog[] = listRes?.data ?? []
  const meta = listRes?.meta
  const summary = statusRes?.data?.summary
  const matrix = statusRes?.data?.statusMatrix ?? []

  const handleCreate = (values: Record<string, unknown>) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Sync log created')
        setDialogOpen(false)
      },
      onError: () => toast.error('Failed to create sync log'),
    })
  }

  const handleUpdate = (values: Record<string, unknown>) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Sync log updated')
        setEditRecord(null)
      },
      onError: () => toast.error('Failed to update sync log'),
    })
  }

  const handleDelete = () => {
    if (!deleteId) return
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success('Sync log deleted')
        setDeleteId(null)
      },
      onError: () => toast.error('Failed to delete sync log'),
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className='bg-green-600 text-white'>Success</Badge>
      case 'failed':
        return <Badge variant='destructive'>Failed</Badge>
      case 'partial':
        return <Badge className='bg-amber-500 text-white'>Partial</Badge>
      case 'in_progress':
        return <Badge className='bg-blue-600 text-white'>In Progress</Badge>
      default:
        return <Badge variant='outline'>{status}</Badge>
    }
  }

  const renderSyncHealth = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className='h-4 w-4 text-green-600' />
      case 'failed':
        return <XCircle className='h-4 w-4 text-red-600' />
      case 'partial':
        return <AlertCircle className='h-4 w-4 text-amber-600' />
      case 'in_progress':
        return <RefreshCw className='h-4 w-4 animate-spin text-blue-600' />
      default:
        return <Clock3 className='h-4 w-4 text-muted-foreground' />
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
            <h2 className='text-2xl font-bold tracking-tight'>Channel Sync Status</h2>
            <p className='text-muted-foreground'>
              Monitor sync health across channels and properties.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' /> Add Sync Log
          </Button>
        </div>

        {summary && (
          <div className='mb-6 grid gap-4 md:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Total Syncs</CardTitle>
                <RefreshCw className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{summary.totalSyncs}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Last 24h</CardTitle>
                <Clock3 className='text-blue-500 h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{summary.recentSyncs24h}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Failures 24h</CardTitle>
                <XCircle className='text-red-500 h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{summary.failedRecent24h}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Avg Duration</CardTitle>
                <CheckCircle2 className='text-green-500 h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{summary.avgDurationMs}ms</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className='mb-6'>
          <CardHeader>
            <CardTitle className='text-sm font-medium'>Current Sync Health</CardTitle>
          </CardHeader>
          <CardContent>
            {matrix.length === 0 ? (
              <p className='text-sm text-muted-foreground'>No sync status data yet.</p>
            ) : (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Airbnb</TableHead>
                      <TableHead>Booking</TableHead>
                      <TableHead>VRBO</TableHead>
                      <TableHead>Expedia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matrix.map((row: any) => (
                      <TableRow key={row.propertyId}>
                        <TableCell className='font-medium'>{row.propertyName}</TableCell>
                        {['airbnb', 'booking', 'vrbo', 'expedia'].map((ch) => (
                          <TableCell key={ch}>
                            <span className='inline-flex items-center gap-2'>
                              {renderSyncHealth(row.channels[ch]?.status)}
                              <span className='text-xs text-muted-foreground'>
                                {row.channels[ch]?.lastSync
                                  ? new Date(row.channels[ch].lastSync).toLocaleString()
                                  : 'Never'}
                              </span>
                            </span>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className='mb-4 flex flex-wrap gap-3'>
          <Select
            value={channelFilter}
            onValueChange={(v) => {
              setChannelFilter(v === 'all' ? '' : v)
              setPage(1)
            }}
          >
            <SelectTrigger className='w-40'>
              <SelectValue placeholder='All Channels' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Channels</SelectItem>
              {CHANNELS.map((ch) => (
                <SelectItem key={ch.value} value={ch.value}>
                  {ch.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v === 'all' ? '' : v)
              setPage(1)
            }}
          >
            <SelectTrigger className='w-44'>
              <SelectValue placeholder='All Sync Types' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Sync Types</SelectItem>
              {SYNC_TYPES.map((t) => (
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
              {SYNC_STATUS.map((s) => (
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
                    <TableHead>Property</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Records</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead className='text-right'>Duration</TableHead>
                    <TableHead className='w-10' />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className='py-8 text-center text-muted-foreground'>
                        No sync logs yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className='font-medium'>{log.property?.name ?? '—'}</TableCell>
                        <TableCell>{log.channel}</TableCell>
                        <TableCell>{log.syncType}</TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell className='text-right'>{log.recordsSynced}</TableCell>
                        <TableCell className='text-xs'>
                          {new Date(log.startedAt).toLocaleString()}
                        </TableCell>
                        <TableCell className='text-xs'>
                          {log.completedAt ? new Date(log.completedAt).toLocaleString() : '—'}
                        </TableCell>
                        <TableCell className='text-right text-xs'>
                          {log.duration != null ? `${log.duration}ms` : '—'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='icon' className='h-8 w-8'>
                                <MoreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem onClick={() => setEditRecord(log)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  const updatePayload: Record<string, unknown> = {
                                    id: log.id,
                                    status: 'success',
                                    completedAt: new Date().toISOString(),
                                  }
                                  if (log.startedAt) {
                                    updatePayload.duration =
                                      Date.now() - new Date(log.startedAt).getTime()
                                  }
                                  updateMutation.mutate(updatePayload, {
                                    onSuccess: () => toast.success('Marked as success'),
                                    onError: () => toast.error('Failed to update'),
                                  })
                                }}
                              >
                                Mark Success
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className='text-destructive'
                                onClick={() => setDeleteId(log.id)}
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

      <SyncLogDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
      />

      <SyncLogDialog
        open={!!editRecord}
        onOpenChange={(o) => !o && setEditRecord(null)}
        onSubmit={handleUpdate}
        isLoading={updateMutation.isPending}
        defaultValues={editRecord}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title='Delete Sync Log'
        description='Are you sure you want to delete this sync log entry?'
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
