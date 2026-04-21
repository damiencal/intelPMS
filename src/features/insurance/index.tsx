import { useState } from 'react'
import {
  AlertTriangle,
  FileText,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Shield,
  ShieldAlert,
  Trash2,
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
  type InsurancePolicy,
  POLICY_TYPES,
  POLICY_STATUSES,
  PREMIUM_FREQUENCIES,
  useInsurancePolicies,
  useInsuranceStats,
  useCreateInsurancePolicy,
  useUpdateInsurancePolicy,
  useDeleteInsurancePolicy,
} from './api'
import { PolicyDialog } from './components/policy-dialog'

export default function InsurancePage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editPolicy, setEditPolicy] = useState<InsurancePolicy | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: listRes, isLoading } = useInsurancePolicies({
    page,
    search: search || undefined,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
  })
  const { data: statsRes } = useInsuranceStats()

  const createMutation = useCreateInsurancePolicy()
  const updateMutation = useUpdateInsurancePolicy()
  const deleteMutation = useDeleteInsurancePolicy()

  const policies: InsurancePolicy[] = listRes?.data ?? []
  const meta = listRes?.meta
  const stats = statsRes?.data

  const handleCreate = (values: Record<string, unknown>) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Policy added')
        setDialogOpen(false)
      },
      onError: () => toast.error('Failed to add policy'),
    })
  }

  const handleUpdate = (values: Record<string, unknown>) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Policy updated')
        setEditPolicy(null)
      },
      onError: () => toast.error('Failed to update policy'),
    })
  }

  const handleDelete = () => {
    if (!deleteId) return
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success('Policy deleted')
        setDeleteId(null)
      },
      onError: () => toast.error('Failed to delete'),
    })
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className='bg-green-600 text-white'>Active</Badge>
      case 'expired':
        return <Badge variant='destructive'>Expired</Badge>
      case 'cancelled':
        return <Badge variant='secondary'>Cancelled</Badge>
      case 'pending_renewal':
        return <Badge className='bg-yellow-500 text-white'>Pending Renewal</Badge>
      default:
        return <Badge variant='outline'>{status}</Badge>
    }
  }

  const getDaysUntilExpiry = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
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
            <h2 className='text-2xl font-bold tracking-tight'>Insurance Management</h2>
            <p className='text-muted-foreground'>
              Track property insurance policies, premiums, and claims.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' /> Add Policy
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className='mb-6 grid gap-4 md:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Active Policies</CardTitle>
                <Shield className='text-green-600 h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.activePolicies}</div>
                <p className='text-muted-foreground text-xs'>
                  of {stats.totalPolicies} total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Annual Premium</CardTitle>
                <FileText className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{formatCurrency(stats.totalAnnualPremium)}</div>
                <p className='text-muted-foreground text-xs'>total annual cost</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Total Coverage</CardTitle>
                <ShieldAlert className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{formatCurrency(stats.totalCoverage)}</div>
                <p className='text-muted-foreground text-xs'>
                  {formatCurrency(stats.totalClaimed)} claimed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Expiring Soon</CardTitle>
                <AlertTriangle className='text-yellow-500 h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.expiringSoon}</div>
                <p className='text-muted-foreground text-xs'>within 30 days</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className='mb-4 flex flex-wrap gap-3'>
          <Input
            placeholder='Search policies...'
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className='w-64'
          />
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-40'>
              <SelectValue placeholder='All Types' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Types</SelectItem>
              {POLICY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-44'>
              <SelectValue placeholder='All Statuses' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Statuses</SelectItem>
              {POLICY_STATUSES.map((s) => (
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
                    <TableHead>Property</TableHead>
                    <TableHead>Policy #</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Premium</TableHead>
                    <TableHead className='text-right'>Coverage</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className='w-10' />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className='py-8 text-center text-muted-foreground'>
                        No insurance policies yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    policies.map((p) => {
                      const daysLeft = getDaysUntilExpiry(p.endDate)
                      return (
                        <TableRow key={p.id}>
                          <TableCell className='font-medium'>
                            {p.property?.name ?? '—'}
                          </TableCell>
                          <TableCell className='font-mono text-sm'>{p.policyNumber}</TableCell>
                          <TableCell>{p.provider}</TableCell>
                          <TableCell>
                            <Badge variant='outline'>
                              {POLICY_TYPES.find((t) => t.value === p.type)?.label ?? p.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(p.status)}</TableCell>
                          <TableCell className='text-right'>
                            <div>
                              {formatCurrency(p.premiumAmount)}
                              <span className='text-xs text-muted-foreground ml-1'>
                                /{PREMIUM_FREQUENCIES.find((f) => f.value === p.premiumFrequency)?.label?.toLowerCase() ?? p.premiumFrequency}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className='text-right'>
                            {formatCurrency(p.coverageAmount)}
                          </TableCell>
                          <TableCell>
                            <div className='text-xs'>
                              {new Date(p.endDate).toLocaleDateString()}
                              {p.status === 'active' && daysLeft <= 30 && daysLeft > 0 && (
                                <span className='text-yellow-600 ml-1'>({daysLeft}d)</span>
                              )}
                              {p.status === 'active' && daysLeft <= 0 && (
                                <span className='text-red-600 ml-1'>(expired)</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant='ghost' size='icon' className='h-8 w-8'>
                                  <MoreHorizontal className='h-4 w-4' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end'>
                                <DropdownMenuItem onClick={() => setEditPolicy(p)}>
                                  <Pencil className='mr-2 h-4 w-4' />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className='text-destructive'
                                  onClick={() => setDeleteId(p.id)}
                                >
                                  <Trash2 className='mr-2 h-4 w-4' />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
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

      <PolicyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
      />

      <PolicyDialog
        open={!!editPolicy}
        onOpenChange={(o) => !o && setEditPolicy(null)}
        onSubmit={handleUpdate}
        isLoading={updateMutation.isPending}
        defaultValues={editPolicy}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null) }}
        title='Delete Policy'
        desc='Are you sure you want to delete this insurance policy?'
        handleConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
