import { useState } from 'react'
import {
  Calculator,
  DollarSign,
  FileCheck,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Eye,
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
  useTaxReports,
  useTaxReportStats,
  useCreateTaxReport,
  useUpdateTaxReport,
  useDeleteTaxReport,
  PERIODS,
  TAX_STATUSES,
  type TaxReport,
} from './api'
import { TaxReportDialog } from './components/tax-report-dialog'

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  finalized: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  filed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
}

function periodLabel(report: TaxReport) {
  if (report.period === 'annual') return String(report.year)
  if (report.period === 'quarterly') return `Q${report.quarter} ${report.year}`
  if (report.period === 'monthly') {
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${monthNames[(report.month ?? 1) - 1]} ${report.year}`
  }
  return report.period
}

export default function TaxReports() {
  const [page, setPage] = useState(1)
  const [yearFilter, setYearFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<TaxReport | null>(null)
  const [previewItem, setPreviewItem] = useState<TaxReport | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const currentYear = new Date().getFullYear()
  const { data, isLoading } = useTaxReports({
    page,
    year: yearFilter ? Number(yearFilter) : undefined,
    period: periodFilter || undefined,
    status: statusFilter || undefined,
  })
  const { data: statsData } = useTaxReportStats(yearFilter ? Number(yearFilter) : currentYear)
  const createMutation = useCreateTaxReport()
  const updateMutation = useUpdateTaxReport()
  const deleteMutation = useDeleteTaxReport()

  const items: TaxReport[] = data?.data ?? []
  const meta = data?.meta
  const stats = statsData?.data

  const handleSubmit = async (formData: Record<string, unknown>) => {
    try {
      if (editItem) {
        await updateMutation.mutateAsync({ id: editItem.id, ...formData })
        toast.success('Tax report updated')
      } else {
        await createMutation.mutateAsync(formData)
        toast.success('Tax report generated')
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
      toast.success('Tax report deleted')
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
            <h2 className='text-2xl font-bold tracking-tight'>Tax Reports</h2>
            <p className='text-muted-foreground'>Generate and manage tax period reports with auto-calculated data.</p>
          </div>
          <Button onClick={() => { setEditItem(null); setDialogOpen(true) }}>
            <Plus className='mr-2 h-4 w-4' /> Generate Report
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className='mb-6 grid gap-4 sm:grid-cols-4'>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Total Income ({stats.year})</CardDescription>
                <CardTitle className='text-2xl'>{formatCurrency(stats.totalIncome)}</CardTitle>
              </CardHeader>
              <CardContent>
                <DollarSign className='h-4 w-4 text-green-500' />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Net Income</CardDescription>
                <CardTitle className={`text-2xl ${stats.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.netIncome)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calculator className='h-4 w-4 text-muted-foreground' />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Estimated Tax</CardDescription>
                <CardTitle className='text-2xl text-orange-600'>{formatCurrency(stats.totalEstimatedTax)}</CardTitle>
              </CardHeader>
              <CardContent>
                <FileCheck className='h-4 w-4 text-orange-500' />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Reports</CardDescription>
                <CardTitle className='text-2xl'>{stats.totalReports}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex gap-2 text-xs'>
                  <span className='text-muted-foreground'>{stats.drafted} draft</span>
                  <span className='text-blue-600'>{stats.finalized} final</span>
                  <span className='text-green-600'>{stats.filed} filed</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className='mb-4 flex gap-3'>
          <Select value={yearFilter} onValueChange={(v) => { setYearFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-[120px]'>
              <SelectValue placeholder='All Years' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Years</SelectItem>
              {[2024, 2025, 2026, 2027].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={periodFilter} onValueChange={(v) => { setPeriodFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='All Periods' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Periods</SelectItem>
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='All Statuses' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Statuses</SelectItem>
              {TAX_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
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
                  <TableHead>Report</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className='text-right'>Income</TableHead>
                  <TableHead className='text-right'>Expenses</TableHead>
                  <TableHead className='text-right'>Net</TableHead>
                  <TableHead className='text-right'>Est. Tax</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='w-[50px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className='text-center text-muted-foreground py-8'>
                      No tax reports found. Generate your first report.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className='font-medium'>{item.name}</TableCell>
                      <TableCell>{periodLabel(item)}</TableCell>
                      <TableCell className='text-right'>{formatCurrency(item.totalIncome)}</TableCell>
                      <TableCell className='text-right'>{formatCurrency(item.totalExpenses)}</TableCell>
                      <TableCell className={`text-right font-medium ${item.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(item.netIncome)}
                      </TableCell>
                      <TableCell className='text-right'>{formatCurrency(item.estimatedTax)}</TableCell>
                      <TableCell>
                        <Badge variant='outline' className={statusColors[item.status] ?? ''}>
                          {TAX_STATUSES.find((s) => s.value === item.status)?.label ?? item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon'>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem onClick={() => setPreviewItem(item)}>
                              <Eye className='mr-2 h-4 w-4' /> View Details
                            </DropdownMenuItem>
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

        {/* Preview Card */}
        {previewItem && (
          <Card className='mt-6'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle>{previewItem.name}</CardTitle>
                  <CardDescription>
                    {periodLabel(previewItem)} &middot; {TAX_STATUSES.find((s) => s.value === previewItem.status)?.label}
                    {previewItem.taxRate && ` &middot; Tax Rate: ${previewItem.taxRate}%`}
                  </CardDescription>
                </div>
                <Button variant='ghost' size='sm' onClick={() => setPreviewItem(null)}>Close</Button>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Summary row */}
              <div className='grid grid-cols-4 gap-4'>
                <div className='rounded-lg border p-3'>
                  <p className='text-xs text-muted-foreground'>Total Income</p>
                  <p className='text-lg font-semibold text-green-600'>{formatCurrency(previewItem.totalIncome)}</p>
                </div>
                <div className='rounded-lg border p-3'>
                  <p className='text-xs text-muted-foreground'>Total Expenses</p>
                  <p className='text-lg font-semibold text-red-600'>{formatCurrency(previewItem.totalExpenses)}</p>
                </div>
                <div className='rounded-lg border p-3'>
                  <p className='text-xs text-muted-foreground'>Net Income</p>
                  <p className={`text-lg font-semibold ${previewItem.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(previewItem.netIncome)}
                  </p>
                </div>
                <div className='rounded-lg border p-3'>
                  <p className='text-xs text-muted-foreground'>Estimated Tax</p>
                  <p className='text-lg font-semibold text-orange-600'>{formatCurrency(previewItem.estimatedTax)}</p>
                </div>
              </div>

              {/* Property Breakdown */}
              {previewItem.propertyBreakdown && previewItem.propertyBreakdown.length > 0 && (
                <div>
                  <h4 className='text-sm font-medium mb-2'>Property Breakdown</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead className='text-right'>Income</TableHead>
                        <TableHead className='text-right'>Expenses</TableHead>
                        <TableHead className='text-right'>Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewItem.propertyBreakdown.map((p) => (
                        <TableRow key={p.propertyId}>
                          <TableCell>{p.propertyName}</TableCell>
                          <TableCell className='text-right'>{formatCurrency(p.income)}</TableCell>
                          <TableCell className='text-right'>{formatCurrency(p.expenses)}</TableCell>
                          <TableCell className={`text-right ${p.income - p.expenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(p.income - p.expenses)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Notes */}
              {previewItem.notes && (
                <div>
                  <h4 className='text-sm font-medium mb-1'>Notes</h4>
                  <p className='text-sm text-muted-foreground whitespace-pre-wrap'>{previewItem.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className='mt-4 flex items-center justify-between'>
            <p className='text-sm text-muted-foreground'>
              Page {meta.page} of {meta.totalPages} ({meta.total} reports)
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

      <TaxReportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editItem}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title='Delete Tax Report?'
        desc='This will permanently remove this report.'
        handleConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
