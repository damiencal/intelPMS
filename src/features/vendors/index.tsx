import { useState } from 'react'
import {
  HardHat,
  Loader2,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Star,
  Trash2,
  Users2,
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
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  useVendors,
  useVendorStats,
  useDeleteVendor,
  SPECIALTIES,
  type Vendor,
} from './api'
import { VendorDialog } from './components/vendor-dialog'

function specialtyLabel(v: string) {
  return SPECIALTIES.find((s) => s.value === v)?.label ?? v.replace(/_/g, ' ')
}

export function Vendors() {
  const [page, setPage] = useState(1)
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Vendor | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: res, isLoading } = useVendors({
    page,
    perPage: 20,
    specialty: specialtyFilter || undefined,
    active: activeFilter || undefined,
  })
  const { data: stats } = useVendorStats()
  const deleteMut = useDeleteVendor()

  const vendors = res?.data ?? []
  const meta = res?.meta

  async function handleDelete() {
    if (!deletingId) return
    try {
      await deleteMut.mutateAsync(deletingId)
      toast.success('Vendor deleted')
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
            <h2 className='text-2xl font-bold tracking-tight'>Vendors</h2>
            <p className='text-muted-foreground'>
              Manage contractors and service providers.
            </p>
          </div>
          <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>
            <Plus className='mr-2 h-4 w-4' /> Add Vendor
          </Button>
        </div>

        {/* Stats */}
        <div className='grid gap-4 sm:grid-cols-3'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Vendors</CardTitle>
              <Users2 className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats?.total ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Active</CardTitle>
              <HardHat className='h-4 w-4 text-green-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-green-600'>{stats?.active ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Specialties</CardTitle>
              <Star className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats?.bySpecialty?.length ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className='mt-4 flex items-center gap-4'>
          <Select value={specialtyFilter} onValueChange={(v) => { setSpecialtyFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-[160px]'>
              <SelectValue placeholder='All specialties' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All specialties</SelectItem>
              {SPECIALTIES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-[130px]'>
              <SelectValue placeholder='All status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All status</SelectItem>
              <SelectItem value='true'>Active</SelectItem>
              <SelectItem value='false'>Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className='flex justify-center py-20'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : vendors.length === 0 ? (
          <Card className='mt-4'>
            <CardContent className='flex flex-col items-center justify-center py-16'>
              <HardHat className='mb-4 h-12 w-12 text-muted-foreground' />
              <CardTitle className='mb-2'>No vendors yet</CardTitle>
              <CardDescription>Add contractors and service providers to manage your team.</CardDescription>
            </CardContent>
          </Card>
        ) : (
          <Card className='mt-4'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='w-[50px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <div>
                        <p className='font-medium'>{v.name}</p>
                        {v.company && <p className='text-sm text-muted-foreground'>{v.company}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline'>{specialtyLabel(v.specialty)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col gap-0.5 text-sm'>
                        {v.email && (
                          <span className='flex items-center gap-1 text-muted-foreground'>
                            <Mail className='h-3 w-3' />{v.email}
                          </span>
                        )}
                        {v.phone && (
                          <span className='flex items-center gap-1 text-muted-foreground'>
                            <Phone className='h-3 w-3' />{v.phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {v.hourlyRate ? `$${v.hourlyRate}/hr` : '—'}
                    </TableCell>
                    <TableCell>
                      {v.rating ? (
                        <span className='flex items-center gap-1'>
                          <Star className='h-3.5 w-3.5 fill-yellow-500 text-yellow-500' />
                          {v.rating.toFixed(1)}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={v.isActive ? 'default' : 'secondary'}>
                        {v.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon' className='h-7 w-7'>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem onClick={() => { setEditing(v); setDialogOpen(true) }}>
                            <Pencil className='mr-2 h-4 w-4' /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className='text-destructive' onClick={() => setDeletingId(v.id)}>
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
        )}
      </Main>

      <VendorDialog open={dialogOpen} onOpenChange={setDialogOpen} vendor={editing} />
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(o) => { if (!o) setDeletingId(null) }}
        title='Delete Vendor'
        desc='Are you sure you want to delete this vendor? This cannot be undone.'
        handleConfirm={handleDelete}
        isLoading={deleteMut.isPending}
      />
    </>
  )
}
