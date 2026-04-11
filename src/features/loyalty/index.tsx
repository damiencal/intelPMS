import { useState } from 'react'
import {
  Award,
  Crown,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Star,
  Trash2,
  Users,
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
import { Input } from '@/components/ui/input'
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
  type LoyaltyMember,
  LOYALTY_TIERS,
  MEMBER_STATUSES,
  useLoyaltyMembers,
  useLoyaltyStats,
  useCreateLoyaltyMember,
  useUpdateLoyaltyMember,
  useDeleteLoyaltyMember,
} from './api'
import { MemberDialog } from './components/member-dialog'

export default function LoyaltyPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMember, setEditMember] = useState<LoyaltyMember | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: listRes, isLoading } = useLoyaltyMembers({
    page,
    search: search || undefined,
    tier: tierFilter || undefined,
    status: statusFilter || undefined,
  })
  const { data: statsRes } = useLoyaltyStats()

  const createMutation = useCreateLoyaltyMember()
  const updateMutation = useUpdateLoyaltyMember()
  const deleteMutation = useDeleteLoyaltyMember()

  const members: LoyaltyMember[] = listRes?.data ?? []
  const meta = listRes?.meta
  const stats = statsRes?.data

  const handleCreate = (values: Record<string, unknown>) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Member enrolled')
        setDialogOpen(false)
      },
      onError: () => toast.error('Failed to enroll member'),
    })
  }

  const handleUpdate = (values: Record<string, unknown>) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Member updated')
        setEditMember(null)
      },
      onError: () => toast.error('Failed to update member'),
    })
  }

  const handleDelete = () => {
    if (!deleteId) return
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success('Member removed')
        setDeleteId(null)
      },
      onError: () => toast.error('Failed to delete'),
    })
  }

  const getTierBadge = (tier: string) => {
    const t = LOYALTY_TIERS.find((l) => l.value === tier)
    if (!t) return <Badge variant='outline'>{tier}</Badge>
    const colors: Record<string, string> = {
      bronze: 'bg-amber-700 text-white',
      silver: 'bg-gray-400 text-white',
      gold: 'bg-yellow-500 text-white',
      platinum: 'bg-slate-600 text-white',
    }
    return <Badge className={colors[tier] || ''}>{t.label}</Badge>
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className='bg-green-600 text-white'>Active</Badge>
      case 'inactive':
        return <Badge variant='secondary'>Inactive</Badge>
      case 'suspended':
        return <Badge variant='destructive'>Suspended</Badge>
      default:
        return <Badge variant='outline'>{status}</Badge>
    }
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)

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
            <h2 className='text-2xl font-bold tracking-tight'>Guest Loyalty Program</h2>
            <p className='text-muted-foreground'>
              Track repeat guests, manage tiers, and reward loyalty.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' /> Enroll Member
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className='mb-6 grid gap-4 md:grid-cols-5'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Total Members</CardTitle>
                <Users className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.totalMembers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Total Stays</CardTitle>
                <Star className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.totalStays}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Total Revenue</CardTitle>
                <Award className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{formatCurrency(stats.totalRevenue)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Outstanding Points</CardTitle>
                <Crown className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.outstandingPoints.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Tier Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex gap-2 text-xs'>
                  <span className='text-amber-700'>B:{stats.tierCounts.bronze}</span>
                  <span className='text-gray-500'>S:{stats.tierCounts.silver}</span>
                  <span className='text-yellow-600'>G:{stats.tierCounts.gold}</span>
                  <span className='text-slate-600'>P:{stats.tierCounts.platinum}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className='mb-4 flex flex-wrap gap-3'>
          <Input
            placeholder='Search members...'
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className='w-64'
          />
          <Select value={tierFilter} onValueChange={(v) => { setTierFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-36'>
              <SelectValue placeholder='All Tiers' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Tiers</SelectItem>
              {LOYALTY_TIERS.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-36'>
              <SelectValue placeholder='All Statuses' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Statuses</SelectItem>
              {MEMBER_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
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
                    <TableHead>Member</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Stays</TableHead>
                    <TableHead className='text-right'>Spent</TableHead>
                    <TableHead className='text-right'>Points</TableHead>
                    <TableHead>Last Stay</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead className='w-10' />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className='py-8 text-center text-muted-foreground'>
                        No loyalty members yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div>
                            <div className='font-medium'>{m.guestName}</div>
                            <div className='text-xs text-muted-foreground'>{m.guestEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getTierBadge(m.tier)}</TableCell>
                        <TableCell>{getStatusBadge(m.status)}</TableCell>
                        <TableCell className='text-right'>{m.totalStays}</TableCell>
                        <TableCell className='text-right'>{formatCurrency(m.totalSpent)}</TableCell>
                        <TableCell className='text-right'>
                          <span className='font-medium'>{m.pointsBalance.toLocaleString()}</span>
                          <span className='text-xs text-muted-foreground ml-1'>pts</span>
                        </TableCell>
                        <TableCell className='text-xs text-muted-foreground'>
                          {m.lastStayDate ? new Date(m.lastStayDate).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell className='text-xs text-muted-foreground'>
                          {new Date(m.enrolledAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='icon' className='h-8 w-8'>
                                <MoreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem onClick={() => setEditMember(m)}>
                                <Pencil className='mr-2 h-4 w-4' />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className='text-destructive'
                                onClick={() => setDeleteId(m.id)}
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

      {/* Create Dialog */}
      <MemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
      />

      {/* Edit Dialog */}
      <MemberDialog
        open={!!editMember}
        onOpenChange={(o) => !o && setEditMember(null)}
        onSubmit={handleUpdate}
        isLoading={updateMutation.isPending}
        defaultValues={editMember}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title='Remove Member'
        description='Are you sure you want to remove this loyalty member?'
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
