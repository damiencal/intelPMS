import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Loader2,
  Link2Off,
  Unplug,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  useConnections,
  useSyncConnection,
  useDeleteConnection,
  useChannexConnections,
  useSyncChannexConnection,
  useDeleteChannexConnection,
} from './api'
import { AddConnectionDialog } from './add-connection-dialog'
import { AddChannexConnectionDialog } from './add-channex-connection-dialog'

function StatusBadge({ status, error }: { status: string; error?: string | null }) {
  const badge = (() => {
    switch (status) {
      case 'active':
      case 'completed':
        return (
          <Badge variant='default' className='bg-green-600'>
            <CheckCircle2 className='mr-1 h-3 w-3' />
            Active
          </Badge>
        )
      case 'syncing':
        return (
          <Badge variant='default' className='bg-blue-600'>
            <RefreshCw className='mr-1 h-3 w-3 animate-spin' />
            Syncing
          </Badge>
        )
      case 'failed':
      case 'error':
        return (
          <Badge variant='destructive' className='cursor-help'>
            <AlertCircle className='mr-1 h-3 w-3' />
            Failed
          </Badge>
        )
      default:
        return (
          <Badge variant='secondary'>
            <Unplug className='mr-1 h-3 w-3' />
            {status}
          </Badge>
        )
    }
  })()

  if ((status === 'failed' || status === 'error') && error) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent side='bottom' className='max-w-xs'>
            <p className='text-xs font-medium'>Sync Error</p>
            <p className='text-xs text-muted-foreground'>{error}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return badge
}

export function ConnectionManager() {
  const { data: connections, isLoading } = useConnections()
  const syncConnection = useSyncConnection()
  const deleteConnection = useDeleteConnection()

  const { data: channexConnections, isLoading: isChannexLoading } = useChannexConnections()
  const syncChannexConnection = useSyncChannexConnection()
  const deleteChannexConnection = useDeleteChannexConnection()

  if (isLoading || isChannexLoading) {
    return (
      <div className='flex items-center justify-center py-10'>
        <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
      </div>
    )
  }

  return (
    <div className='space-y-10'>
      {/* ── Hostex ──────────────────────────────────────────── */}
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-lg font-medium'>Hostex Connections</h3>
            <p className='text-sm text-muted-foreground'>
              Manage your Hostex API connections. Each connection syncs properties,
              reservations, and calendar data.
            </p>
          </div>
          <AddConnectionDialog />
        </div>

        {!connections || connections.length === 0 ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-10'>
              <Link2Off className='h-12 w-12 text-muted-foreground' />
              <h3 className='mt-4 text-lg font-semibold'>No Hostex connections yet</h3>
              <p className='mt-2 text-sm text-muted-foreground'>
                Add your first Hostex connection to start managing your properties.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-4'>
            {connections.map((conn) => (
              <Card key={conn.id}>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <div>
                    <CardTitle className='text-base'>{conn.label}</CardTitle>
                    <CardDescription>
                      {conn._count.properties} properties
                      {conn.lastSyncAt &&
                        ` · Last synced ${new Date(conn.lastSyncAt).toLocaleString()}`}
                    </CardDescription>
                  </div>
                  <StatusBadge status={conn.syncStatus || (conn.isActive ? 'active' : 'inactive')} error={conn.syncError} />
                </CardHeader>
                <CardContent>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={syncConnection.isPending}
                      onClick={() =>
                        syncConnection.mutate(conn.id, {
                          onSuccess: () =>
                            toast.success('Sync started for ' + conn.label),
                          onError: () => toast.error('Failed to start sync'),
                        })
                      }
                    >
                      {syncConnection.isPending ? (
                        <Loader2 className='mr-1 h-4 w-4 animate-spin' />
                      ) : (
                        <RefreshCw className='mr-1 h-4 w-4' />
                      )}
                      Sync Now
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      className='text-destructive hover:text-destructive'
                      disabled={deleteConnection.isPending}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Remove connection "${conn.label}"? This will not delete your Hostex data.`
                          )
                        ) {
                          deleteConnection.mutate(conn.id, {
                            onSuccess: () =>
                              toast.success('Connection removed'),
                            onError: () =>
                              toast.error('Failed to remove connection'),
                          })
                        }
                      }}
                    >
                      <Trash2 className='mr-1 h-4 w-4' />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Channex.io ──────────────────────────────────────── */}
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-lg font-medium'>Channex.io Connections</h3>
            <p className='text-sm text-muted-foreground'>
              Manage your Channex.io API connections. Each connection syncs properties,
              room types, rate plans, and bookings via the booking feed.
            </p>
          </div>
          <AddChannexConnectionDialog />
        </div>

        {!channexConnections || channexConnections.length === 0 ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-10'>
              <Link2Off className='h-12 w-12 text-muted-foreground' />
              <h3 className='mt-4 text-lg font-semibold'>No Channex.io connections yet</h3>
              <p className='mt-2 text-sm text-muted-foreground'>
                Add your first Channex.io connection to start syncing your channel manager data.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-4'>
            {channexConnections.map((conn) => (
              <Card key={conn.id}>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <div>
                    <CardTitle className='text-base'>{conn.label}</CardTitle>
                    <CardDescription>
                      {conn._count.channexProperties} properties
                      {conn.lastSyncAt &&
                        ` · Last synced ${new Date(conn.lastSyncAt).toLocaleString()}`}
                    </CardDescription>
                  </div>
                  <StatusBadge status={conn.syncStatus || (conn.isActive ? 'active' : 'inactive')} error={conn.syncError} />
                </CardHeader>
                <CardContent>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={syncChannexConnection.isPending}
                      onClick={() =>
                        syncChannexConnection.mutate(conn.id, {
                          onSuccess: () =>
                            toast.success('Sync started for ' + conn.label),
                          onError: () => toast.error('Failed to start sync'),
                        })
                      }
                    >
                      {syncChannexConnection.isPending ? (
                        <Loader2 className='mr-1 h-4 w-4 animate-spin' />
                      ) : (
                        <RefreshCw className='mr-1 h-4 w-4' />
                      )}
                      Sync Now
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      className='text-destructive hover:text-destructive'
                      disabled={deleteChannexConnection.isPending}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Remove connection "${conn.label}"? This will also delete the associated Channex webhook.`
                          )
                        ) {
                          deleteChannexConnection.mutate(conn.id, {
                            onSuccess: () =>
                              toast.success('Connection removed'),
                            onError: () =>
                              toast.error('Failed to remove connection'),
                          })
                        }
                      }}
                    >
                      <Trash2 className='mr-1 h-4 w-4' />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
