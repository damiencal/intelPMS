import { useState } from 'react'
import {
  CheckCircle2,
  Copy,
  DoorOpen,
  Eye,
  Key,
  KeyRound,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Wifi,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  useGuestCheckins,
  useDeleteGuestCheckin,
  type GuestCheckin,
} from './api'
import { CheckinDialog } from './components/checkin-dialog'

export function GuestCheckins() {
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<GuestCheckin | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)

  const { data: res, isLoading } = useGuestCheckins({ page, perPage: 20 })
  const deleteMut = useDeleteGuestCheckin()

  const checkins = res?.data ?? []
  const meta = res?.meta
  const previewing = previewId ? checkins.find((c) => c.id === previewId) : null

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
  }

  async function handleDelete() {
    if (!deletingId) return
    try {
      await deleteMut.mutateAsync(deletingId)
      toast.success('Check-in info deleted')
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
            <h2 className='text-2xl font-bold tracking-tight'>Guest Check-in</h2>
            <p className='text-muted-foreground'>
              Manage check-in instructions, access codes, and guest guides.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Link to='/key-handovers'>
              <Button variant='ghost' size='icon' className='h-8 w-8' title='Key Management'>
                <KeyRound size={16} />
              </Button>
            </Link>
            <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>
              <Plus className='mr-2 h-4 w-4' /> New Check-in
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className='flex justify-center py-20'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : checkins.length === 0 ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-16'>
              <DoorOpen className='mb-4 h-12 w-12 text-muted-foreground' />
              <CardTitle className='mb-2'>No check-in info yet</CardTitle>
              <CardDescription>
                Create check-in instructions with access codes, WiFi, and house rules for your guests.
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead>WiFi</TableHead>
                    <TableHead>Times</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='w-[50px]' />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkins.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className='font-medium'>{c.property?.name ?? '—'}</TableCell>
                      <TableCell>{c.guestName ?? '—'}</TableCell>
                      <TableCell>
                        {c.accessCode ? (
                          <button
                            className='flex items-center gap-1 text-sm hover:underline'
                            onClick={() => copyToClipboard(c.accessCode!, 'Access code')}
                          >
                            <Key className='h-3 w-3' /> {c.accessCode}
                            <Copy className='h-3 w-3 text-muted-foreground' />
                          </button>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {c.wifiName ? (
                          <span className='flex items-center gap-1 text-sm'>
                            <Wifi className='h-3 w-3' /> {c.wifiName}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className='whitespace-nowrap text-sm text-muted-foreground'>
                        {c.checkInTime && c.checkOutTime ? `${c.checkInTime} – ${c.checkOutTime}` : c.checkInTime ?? c.checkOutTime ?? '—'}
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-1'>
                          <Badge variant={c.isActive ? 'default' : 'secondary'}>
                            {c.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {c.viewedAt && (
                            <Badge variant='outline' className='text-xs'>
                              <Eye className='mr-0.5 h-3 w-3' /> Viewed
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon' className='h-7 w-7'>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem onClick={() => setPreviewId(c.id)}>
                              <Eye className='mr-2 h-4 w-4' /> Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setEditing(c); setDialogOpen(true) }}>
                              <Pencil className='mr-2 h-4 w-4' /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className='text-destructive' onClick={() => setDeletingId(c.id)}>
                              <Trash2 className='mr-2 h-4 w-4' /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

            {/* Preview card */}
            {previewing && (
              <Card className='mt-4'>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <div>
                      <CardTitle>Guest Check-in Guide</CardTitle>
                      <CardDescription>{previewing.property?.name}</CardDescription>
                    </div>
                    <Button variant='outline' size='sm' onClick={() => setPreviewId(null)}>Close</Button>
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {previewing.guestName && (
                    <p className='text-lg'>Welcome, <strong>{previewing.guestName}</strong>!</p>
                  )}

                  <div className='grid gap-4 sm:grid-cols-3'>
                    {previewing.accessCode && (
                      <Card>
                        <CardContent className='flex items-center gap-3 p-4'>
                          <Key className='h-6 w-6 text-primary' />
                          <div>
                            <p className='text-xs text-muted-foreground'>Access Code</p>
                            <p className='text-lg font-bold'>{previewing.accessCode}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {previewing.wifiName && (
                      <Card>
                        <CardContent className='flex items-center gap-3 p-4'>
                          <Wifi className='h-6 w-6 text-primary' />
                          <div>
                            <p className='text-xs text-muted-foreground'>WiFi</p>
                            <p className='font-medium'>{previewing.wifiName}</p>
                            {previewing.wifiPassword && (
                              <p className='text-sm text-muted-foreground'>pw: {previewing.wifiPassword}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {(previewing.checkInTime || previewing.checkOutTime) && (
                      <Card>
                        <CardContent className='flex items-center gap-3 p-4'>
                          <DoorOpen className='h-6 w-6 text-primary' />
                          <div>
                            <p className='text-xs text-muted-foreground'>Times</p>
                            {previewing.checkInTime && <p className='text-sm'>Check-in: <strong>{previewing.checkInTime}</strong></p>}
                            {previewing.checkOutTime && <p className='text-sm'>Check-out: <strong>{previewing.checkOutTime}</strong></p>}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {previewing.instructions && (
                    <div>
                      <h4 className='mb-1 font-semibold'>Check-in Instructions</h4>
                      <p className='whitespace-pre-wrap text-sm text-muted-foreground'>{previewing.instructions}</p>
                    </div>
                  )}

                  {previewing.houseRules && (
                    <div>
                      <h4 className='mb-1 font-semibold'>House Rules</h4>
                      <p className='whitespace-pre-wrap text-sm text-muted-foreground'>{previewing.houseRules}</p>
                    </div>
                  )}

                  {previewing.parkingInfo && (
                    <div>
                      <h4 className='mb-1 font-semibold'>Parking</h4>
                      <p className='whitespace-pre-wrap text-sm text-muted-foreground'>{previewing.parkingInfo}</p>
                    </div>
                  )}

                  {previewing.emergencyContact && (
                    <div>
                      <h4 className='mb-1 font-semibold'>Emergency Contact</h4>
                      <p className='text-sm'>{previewing.emergencyContact}</p>
                    </div>
                  )}

                  {previewing.guidebookUrl && (
                    <div>
                      <h4 className='mb-1 font-semibold'>Digital Guidebook</h4>
                      <a href={previewing.guidebookUrl} target='_blank' rel='noopener noreferrer' className='text-sm text-primary hover:underline'>
                        View Full Guidebook →
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Main>

      <CheckinDialog open={dialogOpen} onOpenChange={setDialogOpen} checkin={editing} />
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(o) => { if (!o) setDeletingId(null) }}
        title='Delete Check-in Info'
        desc='Are you sure you want to delete this check-in information?'
        handleConfirm={handleDelete}
        isLoading={deleteMut.isPending}
      />
    </>
  )
}
