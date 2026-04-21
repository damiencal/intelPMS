import { useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  Minus,
  MoreHorizontal,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
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
  type CompetitorRate,
  PLATFORMS,
  useCompetitorRates,
  useCompetitorSummary,
  useCreateCompetitorRate,
  useDeleteCompetitorRate,
} from './api'
import { CompetitorRateDialog } from './components/competitor-rate-dialog'

export default function CompetitorRatesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [platform, setPlatform] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: listRes, isLoading } = useCompetitorRates({
    page,
    search: search || undefined,
    platform: platform || undefined,
  })
  const { data: summaryRes } = useCompetitorSummary()

  const createMutation = useCreateCompetitorRate()
  const deleteMutation = useDeleteCompetitorRate()

  const rates: CompetitorRate[] = listRes?.data ?? []
  const meta = listRes?.meta
  const summary = summaryRes?.data

  const handleCreate = (values: Record<string, unknown>) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Competitor rate added')
        setDialogOpen(false)
      },
      onError: () => toast.error('Failed to add competitor rate'),
    })
  }

  const handleDelete = () => {
    if (!deleteId) return
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success('Record deleted')
        setDeleteId(null)
      },
      onError: () => toast.error('Failed to delete'),
    })
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)

  const getDiffBadge = (pct: number) => {
    if (pct < -5) return <Badge variant='destructive'>{pct.toFixed(1)}%</Badge>
    if (pct > 5) return <Badge className='bg-green-600 text-white'>+{pct.toFixed(1)}%</Badge>
    return <Badge variant='secondary'>{pct > 0 ? '+' : ''}{pct.toFixed(1)}%</Badge>
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
            <h2 className='text-2xl font-bold tracking-tight'>Competitor Rates</h2>
            <p className='text-muted-foreground'>
              Monitor competitor pricing and identify opportunities.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' /> Add Rate Check
          </Button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className='mb-6 grid gap-4 md:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Properties Tracked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{summary.propertiesTracked}</div>
                <p className='text-muted-foreground text-xs'>
                  {summary.totalChecks} total checks
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Avg Price Diff</CardTitle>
                {summary.avgDiff > 0 ? (
                  <TrendingUp className='text-green-600 h-4 w-4' />
                ) : (
                  <TrendingDown className='text-red-600 h-4 w-4' />
                )}
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {summary.avgDiff > 0 ? '+' : ''}{summary.avgDiff}%
                </div>
                <p className='text-muted-foreground text-xs'>
                  vs competitors on average
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Cheaper Competitors</CardTitle>
                <ArrowDownRight className='text-red-600 h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{summary.cheaperThanYou}</div>
                <p className='text-muted-foreground text-xs'>
                  listings priced below you
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>More Expensive</CardTitle>
                <ArrowUpRight className='text-green-600 h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{summary.moreExpensive}</div>
                <p className='text-muted-foreground text-xs'>
                  listings priced above you
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className='mb-4 flex flex-wrap gap-3'>
          <Input
            placeholder='Search competitors...'
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className='w-64'
          />
          <Select value={platform} onValueChange={(v) => { setPlatform(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-40'>
              <SelectValue placeholder='All Platforms' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Platforms</SelectItem>
              {PLATFORMS.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
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
                    <TableHead>Competitor</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead className='text-right'>Their Price</TableHead>
                    <TableHead className='text-right'>Your Price</TableHead>
                    <TableHead className='text-right'>Diff</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Checked</TableHead>
                    <TableHead className='w-10' />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className='py-8 text-center text-muted-foreground'>
                        No competitor rates recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rates.map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell className='font-medium'>
                          {rate.property?.name ?? '—'}
                        </TableCell>
                        <TableCell>
                          {rate.competitorUrl ? (
                            <a
                              href={rate.competitorUrl}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-blue-600 hover:underline'
                            >
                              {rate.competitorName}
                            </a>
                          ) : (
                            rate.competitorName
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline'>
                            {PLATFORMS.find((p) => p.value === rate.platform)?.label ?? rate.platform}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-right'>
                          {formatCurrency(rate.competitorPrice)}
                        </TableCell>
                        <TableCell className='text-right'>
                          {formatCurrency(rate.yourPrice)}
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex items-center justify-end gap-1'>
                            {rate.priceDiff > 0 ? (
                              <ArrowUpRight className='h-3 w-3 text-green-600' />
                            ) : rate.priceDiff < 0 ? (
                              <ArrowDownRight className='h-3 w-3 text-red-600' />
                            ) : (
                              <Minus className='h-3 w-3' />
                            )}
                            {getDiffBadge(rate.priceDiffPct)}
                          </div>
                        </TableCell>
                        <TableCell className='text-xs'>
                          {new Date(rate.checkInDate).toLocaleDateString()} →{' '}
                          {new Date(rate.checkOutDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className='text-xs text-muted-foreground'>
                          {new Date(rate.checkDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='icon' className='h-8 w-8'>
                                <MoreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem
                                className='text-destructive'
                                onClick={() => setDeleteId(rate.id)}
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

      <CompetitorRateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null) }}
        title='Delete Competitor Rate'
        desc='Are you sure you want to delete this rate record?'
        handleConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
