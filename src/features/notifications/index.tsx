import { useState } from 'react'
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Loader2,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
  useDeleteNotification,
  type AppNotification,
} from './api'

function typeIcon(type: string) {
  const colors: Record<string, string> = {
    booking: 'bg-blue-100 text-blue-600',
    check_in: 'bg-green-100 text-green-600',
    check_out: 'bg-orange-100 text-orange-600',
    review: 'bg-yellow-100 text-yellow-600',
    maintenance: 'bg-red-100 text-red-600',
    expense: 'bg-purple-100 text-purple-600',
    cleaning: 'bg-cyan-100 text-cyan-600',
    inventory: 'bg-amber-100 text-amber-600',
    system: 'bg-gray-100 text-gray-600',
  }
  return colors[type] ?? colors.system
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

export function Notifications() {
  const [page, setPage] = useState(1)
  const [unreadOnly, setUnreadOnly] = useState(false)

  const { data: res, isLoading } = useNotifications({
    page,
    perPage: 30,
    unread: unreadOnly || undefined,
  })
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()
  const deleteMut = useDeleteNotification()

  const notifications = res?.data ?? []
  const meta = res?.meta
  const unreadCount = meta?.unreadCount ?? 0

  async function handleMarkAllRead() {
    try {
      await markAllRead.mutateAsync()
      toast.success('All marked as read')
    } catch { toast.error('Failed') }
  }

  async function handleMarkRead(n: AppNotification) {
    if (n.isRead) return
    try { await markRead.mutateAsync(n.id) } catch { /* ignore */ }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMut.mutateAsync(id)
      toast.success('Notification deleted')
    } catch { toast.error('Failed to delete') }
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
        <div className='mb-4 flex flex-wrap items-center justify-between gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              Notifications
              {unreadCount > 0 && (
                <Badge variant='destructive' className='ml-2 align-middle'>
                  {unreadCount}
                </Badge>
              )}
            </h2>
            <p className='text-muted-foreground'>
              Stay up to date with events across your properties.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant={unreadOnly ? 'default' : 'outline'}
              size='sm'
              onClick={() => { setUnreadOnly(!unreadOnly); setPage(1) }}
            >
              <BellOff className='mr-1 h-3.5 w-3.5' />
              {unreadOnly ? 'Show All' : 'Unread Only'}
            </Button>
            {unreadCount > 0 && (
              <Button variant='outline' size='sm' onClick={handleMarkAllRead} disabled={markAllRead.isPending}>
                <CheckCheck className='mr-1 h-3.5 w-3.5' /> Mark All Read
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className='flex justify-center py-20'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-16'>
              <Bell className='mb-4 h-12 w-12 text-muted-foreground' />
              <CardTitle className='mb-2'>No notifications</CardTitle>
              <CardDescription>
                {unreadOnly ? 'All caught up! No unread notifications.' : 'Notifications will appear here as events happen.'}
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-2'>
            {notifications.map((n) => (
              <Card
                key={n.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${!n.isRead ? 'border-l-4 border-l-primary' : ''}`}
                onClick={() => handleMarkRead(n)}
              >
                <div className='flex items-start gap-3 p-4'>
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${typeIcon(n.type)}`}>
                    <Bell className='h-4 w-4' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-start justify-between gap-2'>
                      <div>
                        <p className={`text-sm ${!n.isRead ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                        <p className='mt-0.5 text-sm text-muted-foreground'>{n.message}</p>
                      </div>
                      <div className='flex shrink-0 items-center gap-1'>
                        <span className='whitespace-nowrap text-xs text-muted-foreground'>{timeAgo(n.createdAt)}</span>
                        {!n.isRead && (
                          <Button variant='ghost' size='icon' className='h-6 w-6' title='Mark read' onClick={(e) => { e.stopPropagation(); handleMarkRead(n) }}>
                            <Check className='h-3 w-3' />
                          </Button>
                        )}
                        <Button variant='ghost' size='icon' className='h-6 w-6 text-destructive' onClick={(e) => { e.stopPropagation(); handleDelete(n.id) }}>
                          <Trash2 className='h-3 w-3' />
                        </Button>
                      </div>
                    </div>
                    <div className='mt-1 flex items-center gap-2'>
                      <Badge variant='outline' className='text-xs capitalize'>{n.type.replace(/_/g, ' ')}</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {meta && meta.totalPages > 1 && (
              <div className='flex items-center justify-between py-3'>
                <p className='text-sm text-muted-foreground'>
                  Page {meta.page} of {meta.totalPages}
                </p>
                <div className='flex gap-2'>
                  <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                  <Button variant='outline' size='sm' disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Main>
    </>
  )
}
