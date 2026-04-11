import { useState } from 'react'
import {
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MailX,
  Send,
  Trash2,
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
  useAutoMessages,
  useAutoMessageStats,
  useUpdateAutoMessage,
  useDeleteAutoMessage,
  TRIGGER_EVENTS,
  type AutoMessage,
} from './api'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
]

function statusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (s) {
    case 'sent': return 'default'
    case 'pending': return 'secondary'
    case 'failed': return 'destructive'
    default: return 'outline'
  }
}

function triggerLabel(t: string) {
  return TRIGGER_EVENTS.find((x) => x.value === t)?.label ?? t.replace(/_/g, ' ')
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function AutoMessages() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [triggerFilter, setTriggerFilter] = useState<string>('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: res, isLoading } = useAutoMessages({
    page,
    perPage: 20,
    status: statusFilter || undefined,
    triggerEvent: triggerFilter || undefined,
  })
  const { data: stats } = useAutoMessageStats()
  const updateMut = useUpdateAutoMessage()
  const deleteMut = useDeleteAutoMessage()

  const messages = res?.data ?? []
  const meta = res?.meta

  async function handleCancel(msg: AutoMessage) {
    try {
      await updateMut.mutateAsync({ id: msg.id, status: 'cancelled' })
      toast.success('Message cancelled')
    } catch { toast.error('Failed to cancel') }
  }

  async function handleMarkSent(msg: AutoMessage) {
    try {
      await updateMut.mutateAsync({ id: msg.id, status: 'sent' })
      toast.success('Marked as sent')
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
            <h2 className='text-2xl font-bold tracking-tight'>Auto Messages</h2>
            <p className='text-muted-foreground'>
              Automated guest communications triggered by booking events.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
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
              <CardTitle className='text-sm font-medium'>Sent</CardTitle>
              <CheckCircle2 className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats?.sent ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Failed</CardTitle>
              <MailX className='h-4 w-4 text-destructive' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-destructive'>{stats?.failed ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Cancelled</CardTitle>
              <XCircle className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats?.cancelled ?? 0}</div>
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
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={triggerFilter} onValueChange={(v) => { setTriggerFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='All triggers' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All triggers</SelectItem>
              {TRIGGER_EVENTS.map((t) => (
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
        ) : messages.length === 0 ? (
          <Card className='mt-4'>
            <CardContent className='flex flex-col items-center justify-center py-16'>
              <Mail className='mb-4 h-12 w-12 text-muted-foreground' />
              <CardTitle className='mb-2'>No auto messages</CardTitle>
              <CardDescription>
                Messages will appear here when triggered by booking events and enabled templates.
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <Card className='mt-4'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead className='w-[100px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className='font-medium'>{m.guestName ?? '—'}</TableCell>
                    <TableCell className='text-muted-foreground'>{m.template?.name ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant='outline'>{triggerLabel(m.triggerEvent)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(m.status)}>{m.status}</Badge>
                    </TableCell>
                    <TableCell className='whitespace-nowrap text-muted-foreground'>
                      {formatDateTime(m.scheduledAt)}
                    </TableCell>
                    <TableCell className='whitespace-nowrap text-muted-foreground'>
                      {m.sentAt ? formatDateTime(m.sentAt) : '—'}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1'>
                        {m.status === 'pending' && (
                          <>
                            <Button variant='ghost' size='icon' className='h-7 w-7' title='Mark as sent' onClick={() => handleMarkSent(m)}>
                              <Send className='h-3.5 w-3.5' />
                            </Button>
                            <Button variant='ghost' size='icon' className='h-7 w-7 text-destructive' title='Cancel' onClick={() => handleCancel(m)}>
                              <XCircle className='h-3.5 w-3.5' />
                            </Button>
                          </>
                        )}
                        <Button variant='ghost' size='icon' className='h-7 w-7 text-destructive' onClick={() => setDeletingId(m.id)}>
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

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(o) => { if (!o) setDeletingId(null) }}
        title='Delete Message'
        desc='Are you sure you want to delete this auto message record?'
        handleConfirm={handleDelete}
        isLoading={deleteMut.isPending}
      />
    </>
  )
}
