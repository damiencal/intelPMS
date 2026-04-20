import { useState } from 'react'
import {
  AlertTriangle,
  ArrowDownUp,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Plus,
  Scale,
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
  useRateParityChecks,
  useParitySummary,
  useCreateParityCheck,
  useDeleteParityCheck,
  PARITY_STATUSES,
  type RateParityCheck,
} from './api'
import { ParityCheckDialog } from './components/parity-check-dialog'

const statusIcons: Record<string, React.ReactNode> = {
  in_parity: <CheckCircle2 className='h-4 w-4 text-green-500' />,
  minor_diff: <AlertTriangle className='h-4 w-4 text-yellow-500' />,
  major_diff: <XCircle className='h-4 w-4 text-red-500' />,
}

const statusColors: Record<string, string> = {
  in_parity: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  minor_diff: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  major_diff: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

function formatCurrency(v: number | null) {
  if (v === null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
}

export default function RateParity() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading } = useRateParityChecks({
    page,
    parity_status: statusFilter || undefined,
  })
  const { data: summaryData } = useParitySummary()
  const createMutation = useCreateParityCheck()
  const deleteMutation = useDeleteParityCheck()

  const items: RateParityCheck[] = data?.data ?? []
  const meta = data?.meta
  const summary = summaryData?.data
  const propertyChecks = summaryData?.data?.lastChecks ?? []

  const handleSubmit = async (formData: Record<string, unknown>) => {
    try {
      await createMutation.mutateAsync(formData)
      toast.success('Parity check recorded')
    } catch {
      toast.error('Operation failed')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Check deleted')
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
            <h2 className='text-2xl font-bold tracking-tight'>Rate Parity Monitor</h2>
            <p className='text-muted-foreground'>Track pricing consistency across booking channels.</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' /> New Check
          </Button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className='mb-6 grid gap-4 sm:grid-cols-4'>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>In Parity</CardDescription>
                <CardTitle className='text-2xl text-green-600'>{summary.inParity}</CardTitle>
              </CardHeader>
              <CardContent>
                <CheckCircle2 className='h-4 w-4 text-green-500' />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Minor Difference</CardDescription>
                <CardTitle className='text-2xl text-yellow-600'>{summary.minorDiff}</CardTitle>
              </CardHeader>
              <CardContent>
                <AlertTriangle className='h-4 w-4 text-yellow-500' />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Major Difference</CardDescription>
                <CardTitle className='text-2xl text-red-600'>{summary.majorDiff}</CardTitle>
              </CardHeader>
              <CardContent>
                <XCircle className='h-4 w-4 text-red-500' />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Unchecked</CardDescription>
                <CardTitle className='text-2xl'>{summary.unchecked}</CardTitle>
              </CardHeader>
              <CardContent>
                <Scale className='h-4 w-4 text-muted-foreground' />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Property Overview */}
        {propertyChecks.length > 0 && (
          <Card className='mb-6'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <ArrowDownUp className='h-5 w-5' /> Property Parity Status
              </CardTitle>
              <CardDescription>Latest parity check per property</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
                {propertyChecks.map((p: any) => (
                  <div key={p.id} className='flex items-center justify-between rounded-lg border p-3'>
                    <span className='text-sm font-medium truncate mr-2'>{p.name}</span>
                    {p.latestCheck ? (
                      <div className='flex items-center gap-2'>
                        {statusIcons[p.latestCheck.parityStatus]}
                        <Badge variant='outline' className={statusColors[p.latestCheck.parityStatus] ?? ''}>
                          {p.latestCheck.priceDiffPct !== null ? `${p.latestCheck.priceDiffPct}%` : PARITY_STATUSES.find((s) => s.value === p.latestCheck.parityStatus)?.label}
                        </Badge>
                      </div>
                    ) : (
                      <Badge variant='outline'>Not checked</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className='mb-4 flex gap-3'>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='All Statuses' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Statuses</SelectItem>
              {PARITY_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Checks Table */}
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
                  <TableHead>Check Date</TableHead>
                  <TableHead>Channels</TableHead>
                  <TableHead className='text-right'>Lowest</TableHead>
                  <TableHead className='text-right'>Highest</TableHead>
                  <TableHead className='text-right'>Diff %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='w-[50px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className='text-center text-muted-foreground py-8'>
                      No parity checks yet. Run your first check.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <>
                      <TableRow key={item.id} className='cursor-pointer' onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                        <TableCell className='font-medium'>{item.property?.name ?? '—'}</TableCell>
                        <TableCell>{new Date(item.checkDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {Array.isArray(item.channels) ? item.channels.length : 0} channels
                        </TableCell>
                        <TableCell className='text-right'>{formatCurrency(item.lowestPrice)}</TableCell>
                        <TableCell className='text-right'>{formatCurrency(item.highestPrice)}</TableCell>
                        <TableCell className='text-right'>
                          {item.priceDiffPct !== null ? (
                            <span className={item.priceDiffPct > 10 ? 'text-red-600 font-medium' : item.priceDiffPct > 3 ? 'text-yellow-600' : 'text-green-600'}>
                              {item.priceDiffPct}%
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline' className={statusColors[item.parityStatus] ?? ''}>
                            {statusIcons[item.parityStatus]}
                            <span className='ml-1'>
                              {PARITY_STATUSES.find((s) => s.value === item.parityStatus)?.label ?? item.parityStatus}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='icon' onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem className='text-destructive' onClick={(e) => { e.stopPropagation(); setDeleteId(item.id) }}>
                                <Trash2 className='mr-2 h-4 w-4' /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>

                      {/* Expanded channel details */}
                      {expandedId === item.id && Array.isArray(item.channels) && (
                        <TableRow key={`${item.id}-detail`}>
                          <TableCell colSpan={8} className='bg-muted/30 px-8 py-4'>
                            <div className='space-y-1'>
                              <p className='text-sm font-medium mb-2'>Channel Prices</p>
                              <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-4'>
                                {(item.channels as any[]).map((ch, i) => (
                                  <div key={i} className='flex items-center justify-between rounded border bg-background p-2'>
                                    <span className='text-sm'>{ch.name || ch.channel}</span>
                                    <div className='flex items-center gap-2'>
                                      <span className='text-sm font-medium'>{formatCurrency(ch.price)}</span>
                                      {ch.url && (
                                        <a href={ch.url} target='_blank' rel='noopener noreferrer'>
                                          <ExternalLink className='h-3 w-3 text-muted-foreground hover:text-foreground' />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {item.notes && <p className='text-xs text-muted-foreground mt-2'>{item.notes}</p>}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
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
              Page {meta.page} of {meta.totalPages} ({meta.total} checks)
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

      <ParityCheckDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title='Delete Parity Check?'
        desc='This will permanently remove this rate parity check.'
        handleConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
