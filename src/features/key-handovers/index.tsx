import { useState } from 'react'
import {
  Key,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
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
  useKeyHandovers,
  useKeyHandoverStats,
  useCreateKeyHandover,
  useUpdateKeyHandover,
  useDeleteKeyHandover,
  KEY_TYPES,
  KEY_STATUSES,
  type KeyHandover,
} from './api'
import { KeyHandoverDialog } from './components/key-handover-dialog'

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  returned: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  lost: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  deactivated: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
}

export default function KeyHandovers() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<KeyHandover | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useKeyHandovers({
    page,
    status: statusFilter || undefined,
    keyType: typeFilter || undefined,
  })
  const { data: statsData } = useKeyHandoverStats()
  const createMutation = useCreateKeyHandover()
  const updateMutation = useUpdateKeyHandover()
  const deleteMutation = useDeleteKeyHandover()

  const items: KeyHandover[] = data?.data ?? []
  const meta = data?.meta
  const stats = statsData?.data

  const handleSubmit = async (formData: Record<string, unknown>) => {
    try {
      if (editItem) {
        await updateMutation.mutateAsync({ id: editItem.id, ...formData })
        toast.success('Key updated')
      } else {
        await createMutation.mutateAsync(formData)
        toast.success('Key added')
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
      toast.success('Key deleted')
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
            <h2 className='text-2xl font-bold tracking-tight'>Key Management</h2>
            <p className='text-muted-foreground'>Track keys, locks, and access devices across properties.</p>
          </div>
          <Button onClick={() => { setEditItem(null); setDialogOpen(true) }}>
            <Plus className='mr-2 h-4 w-4' /> Add Key
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className='mb-6 grid gap-4 sm:grid-cols-4'>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Total Keys</CardDescription>
                <CardTitle className='text-2xl'>{stats.total}</CardTitle>
              </CardHeader>
              <CardContent>
                <Key className='h-4 w-4 text-muted-foreground' />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Available</CardDescription>
                <CardTitle className='text-2xl text-green-600'>{stats.available}</CardTitle>
              </CardHeader>
              <CardContent>
                <CheckCircle2 className='h-4 w-4 text-green-500' />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Assigned</CardDescription>
                <CardTitle className='text-2xl text-blue-600'>{stats.assigned}</CardTitle>
              </CardHeader>
              <CardContent>
                <UserCheck className='h-4 w-4 text-blue-500' />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Lost</CardDescription>
                <CardTitle className='text-2xl text-red-600'>{stats.lost}</CardTitle>
              </CardHeader>
              <CardContent>
                <AlertTriangle className='h-4 w-4 text-red-500' />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className='mb-4 flex gap-3'>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-[160px]'>
              <SelectValue placeholder='All Statuses' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Statuses</SelectItem>
              {KEY_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-[160px]'>
              <SelectValue placeholder='All Types' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Types</SelectItem>
              {KEY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
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
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Identifier</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead className='w-[50px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className='text-center text-muted-foreground py-8'>
                      No keys found. Add your first key to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className='font-medium'>{item.property?.name ?? '—'}</TableCell>
                      <TableCell>
                        {KEY_TYPES.find((t) => t.value === item.keyType)?.label ?? item.keyType}
                      </TableCell>
                      <TableCell>
                        <code className='rounded bg-muted px-1.5 py-0.5 text-sm'>{item.keyIdentifier}</code>
                      </TableCell>
                      <TableCell>{item.assignedTo || '—'}</TableCell>
                      <TableCell>
                        <Badge variant='outline' className={statusColors[item.status] ?? ''}>
                          {KEY_STATUSES.find((s) => s.value === item.status)?.label ?? item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.assignedDate
                          ? new Date(item.assignedDate).toLocaleDateString()
                          : '—'}
                      </TableCell>
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
              Page {meta.page} of {meta.totalPages} ({meta.total} keys)
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

      <KeyHandoverDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editItem}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title='Delete Key?'
        desc='This will permanently remove this key record.'
        handleConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
