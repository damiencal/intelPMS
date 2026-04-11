import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowDown,
  ArrowUp,
  Check,
  DollarSign,
  Lightbulb,
  Loader2,
  MoreHorizontal,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
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
  type PricingRecommendation,
  usePricingRecs,
  usePricingRecsStats,
  useGenerateRecs,
  useAcceptRec,
  useRejectRec,
  useDeleteRec,
} from './api'

export default function PricingRecommendationsPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [propertyFilter, setPropertyFilter] = useState<string>('')
  const [generatePropertyId, setGeneratePropertyId] = useState<string>('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: listRes, isLoading } = usePricingRecs({
    page,
    status: statusFilter || undefined,
    property_id: propertyFilter || undefined,
  })
  const { data: statsRes } = usePricingRecsStats()
  const { data: propertiesRes } = useQuery({
    queryKey: ['properties', 'all'],
    queryFn: () => api.get('/api/properties?per_page=100').then((r) => r.json()),
  })

  const generateMutation = useGenerateRecs()
  const acceptMutation = useAcceptRec()
  const rejectMutation = useRejectRec()
  const deleteMutation = useDeleteRec()

  const recs: PricingRecommendation[] = listRes?.data ?? []
  const meta = listRes?.meta
  const stats = statsRes?.data
  const properties = propertiesRes?.data ?? []

  const handleGenerate = () => {
    if (!generatePropertyId) {
      toast.error('Select a property first')
      return
    }
    generateMutation.mutate(
      { propertyId: generatePropertyId },
      {
        onSuccess: (res) => {
          toast.success(`Generated ${res.count} recommendations`)
        },
        onError: () => toast.error('Failed to generate'),
      }
    )
  }

  const handleAccept = (id: string) => {
    acceptMutation.mutate(id, {
      onSuccess: () => toast.success('Recommendation accepted'),
      onError: () => toast.error('Failed to accept'),
    })
  }

  const handleReject = (id: string) => {
    rejectMutation.mutate(id, {
      onSuccess: () => toast.success('Recommendation rejected'),
      onError: () => toast.error('Failed to reject'),
    })
  }

  const handleDelete = () => {
    if (!deleteId) return
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success('Deleted')
        setDeleteId(null)
      },
      onError: () => toast.error('Failed to delete'),
    })
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className='bg-yellow-500 text-white'>Pending</Badge>
      case 'accepted':
        return <Badge className='bg-green-600 text-white'>Accepted</Badge>
      case 'rejected':
        return <Badge variant='destructive'>Rejected</Badge>
      case 'expired':
        return <Badge variant='secondary'>Expired</Badge>
      default:
        return <Badge variant='outline'>{status}</Badge>
    }
  }

  const getPriceDiff = (rec: PricingRecommendation) => {
    const diff = rec.recommendedPrice - rec.currentPrice
    const pct = ((diff / (rec.currentPrice || 1)) * 100).toFixed(1)
    if (diff > 0)
      return (
        <span className='flex items-center text-green-600'>
          <ArrowUp className='mr-0.5 h-3 w-3' />+{pct}%
        </span>
      )
    if (diff < 0)
      return (
        <span className='flex items-center text-red-600'>
          <ArrowDown className='mr-0.5 h-3 w-3' />{pct}%
        </span>
      )
    return <span className='text-muted-foreground'>0%</span>
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
            <h2 className='text-2xl font-bold tracking-tight'>Dynamic Pricing</h2>
            <p className='text-muted-foreground'>
              AI-powered pricing recommendations based on demand, seasonality & competitors.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Select
              value={generatePropertyId}
              onValueChange={setGeneratePropertyId}
            >
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='Select property' />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Sparkles className='mr-2 h-4 w-4' />
              )}
              Generate
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className='mb-6 grid gap-4 md:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Total Recs</CardTitle>
                <Lightbulb className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.total}</div>
                <p className='text-muted-foreground text-xs'>
                  {stats.pending} pending
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Accepted</CardTitle>
                <Check className='text-green-600 h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.accepted}</div>
                <p className='text-muted-foreground text-xs'>
                  {stats.rejected} rejected
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Avg Confidence</CardTitle>
                <Target className='text-blue-500 h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {(stats.avgConfidence * 100).toFixed(0)}%
                </div>
                <p className='text-muted-foreground text-xs'>
                  Avg diff: {stats.avgPriceDiffPct > 0 ? '+' : ''}
                  {stats.avgPriceDiffPct}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Potential Revenue</CardTitle>
                <DollarSign className='text-green-500 h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {formatCurrency(stats.potentialRevenue)}
                </div>
                <p className='text-muted-foreground text-xs'>from pending increases</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className='mb-4 flex flex-wrap gap-3'>
          <Select
            value={propertyFilter}
            onValueChange={(v) => {
              setPropertyFilter(v === 'all' ? '' : v)
              setPage(1)
            }}
          >
            <SelectTrigger className='w-48'>
              <SelectValue placeholder='All Properties' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Properties</SelectItem>
              {properties.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
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
              <SelectItem value='pending'>Pending</SelectItem>
              <SelectItem value='accepted'>Accepted</SelectItem>
              <SelectItem value='rejected'>Rejected</SelectItem>
              <SelectItem value='expired'>Expired</SelectItem>
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
                    <TableHead>Date</TableHead>
                    <TableHead className='text-right'>Current</TableHead>
                    <TableHead className='text-right'>Recommended</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='w-10' />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className='py-8 text-center text-muted-foreground'
                      >
                        No pricing recommendations yet. Select a property and click Generate.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recs.map((rec) => (
                      <TableRow key={rec.id}>
                        <TableCell className='font-medium'>
                          {rec.property?.name ?? '—'}
                        </TableCell>
                        <TableCell className='text-sm'>
                          {new Date(rec.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className='text-right'>
                          {formatCurrency(rec.currentPrice)}
                        </TableCell>
                        <TableCell className='text-right font-semibold'>
                          {formatCurrency(rec.recommendedPrice)}
                        </TableCell>
                        <TableCell>{getPriceDiff(rec)}</TableCell>
                        <TableCell>
                          {rec.confidence != null ? (
                            <div className='flex items-center gap-1'>
                              <div className='h-1.5 w-16 overflow-hidden rounded-full bg-muted'>
                                <div
                                  className='h-full rounded-full bg-blue-500'
                                  style={{
                                    width: `${(rec.confidence * 100).toFixed(0)}%`,
                                  }}
                                />
                              </div>
                              <span className='text-xs'>
                                {(rec.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell
                          className='max-w-[200px] truncate text-xs text-muted-foreground'
                          title={rec.reason ?? ''}
                        >
                          {rec.reason ?? '—'}
                        </TableCell>
                        <TableCell>{getStatusBadge(rec.status)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8'
                              >
                                <MoreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              {rec.status === 'pending' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleAccept(rec.id)}
                                  >
                                    <Check className='mr-2 h-4 w-4' />
                                    Accept
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleReject(rec.id)}
                                  >
                                    <X className='mr-2 h-4 w-4' />
                                    Reject
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem
                                className='text-destructive'
                                onClick={() => setDeleteId(rec.id)}
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

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title='Delete Recommendation'
        description='Are you sure you want to delete this pricing recommendation?'
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
