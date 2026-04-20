import { useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  ChevronDown,
  ChevronRight,
  Loader2,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Separator } from '@/components/ui/separator'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  useOwnerStatementsSummary,
  usePropertyStatement,
} from './api'

function fmtCurrency(val: number, currency?: string | null) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency ?? 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val)
}

function PropertyDetail({ propertyId }: { propertyId: string }) {
  const { data, isLoading } = usePropertyStatement(propertyId, 6)

  if (isLoading) {
    return (
      <div className='flex justify-center py-8'>
        <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
      </div>
    )
  }

  if (!data) return null

  const cur = data.property.currency

  return (
    <div className='space-y-4 pb-2 pt-2'>
      {/* Summary banner */}
      <div className='grid gap-4 sm:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Total Revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-xl font-bold text-green-600'>{fmtCurrency(data.summary.totalRevenue, cur)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Total Expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-xl font-bold text-red-600'>{fmtCurrency(data.summary.totalExpenses, cur)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Maintenance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-xl font-bold text-orange-600'>{fmtCurrency(data.summary.totalMaintenance, cur)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Net Income</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-xl font-bold ${data.summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {fmtCurrency(data.summary.netIncome, cur)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly statements */}
      {data.statements.map((stmt) => (
        <Card key={stmt.monthStart}>
          <CardHeader>
            <CardTitle className='text-base'>{stmt.month}</CardTitle>
            <CardDescription>
              Net: <span className={stmt.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>{fmtCurrency(stmt.netIncome, cur)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {/* Revenue */}
            {stmt.revenue.reservations.length > 0 && (
              <div>
                <p className='mb-1 text-sm font-medium'>Revenue ({fmtCurrency(stmt.revenue.total, cur)})</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead className='text-right'>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stmt.revenue.reservations.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.guestName ?? '—'}</TableCell>
                        <TableCell className='whitespace-nowrap'>{new Date(r.checkIn).toLocaleDateString()}</TableCell>
                        <TableCell className='whitespace-nowrap'>{new Date(r.checkOut).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant='outline'>{r.channel ?? '—'}</Badge>
                        </TableCell>
                        <TableCell className='text-right font-medium'>{fmtCurrency(r.amount ?? 0, cur)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Expenses */}
            {stmt.expenses.byCategory.length > 0 && (
              <div>
                <p className='mb-1 text-sm font-medium'>Expenses ({fmtCurrency(stmt.expenses.total, cur)})</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className='text-right'>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stmt.expenses.byCategory.map((ec) => (
                      <TableRow key={ec.category}>
                        <TableCell className='capitalize'>{ec.category.replace(/_/g, ' ')}</TableCell>
                        <TableCell className='text-right'>{fmtCurrency(ec.amount, cur)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Maintenance */}
            {stmt.maintenance.items.length > 0 && (
              <div>
                <p className='mb-1 text-sm font-medium'>Maintenance ({fmtCurrency(stmt.maintenance.total, cur)})</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className='text-right'>Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stmt.maintenance.items.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>{item.title}</TableCell>
                        <TableCell>
                          <Badge variant='outline'>{item.status}</Badge>
                        </TableCell>
                        <TableCell className='text-right'>
                          {fmtCurrency(item.actualCost ?? item.estimatedCost ?? 0, cur)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {stmt.revenue.reservations.length === 0 && stmt.expenses.byCategory.length === 0 && stmt.maintenance.items.length === 0 && (
              <p className='text-sm text-muted-foreground'>No activity this month.</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function OwnerStatements() {
  const [months, setMonths] = useState(3)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: summaries, isLoading } = useOwnerStatementsSummary(months)

  const totals = summaries?.reduce(
    (t, s) => ({
      revenue: t.revenue + s.revenue,
      expenses: t.expenses + s.expenses,
      net: t.net + s.netIncome,
      reservations: t.reservations + s.reservationCount,
    }),
    { revenue: 0, expenses: 0, net: 0, reservations: 0 }
  ) ?? { revenue: 0, expenses: 0, net: 0, reservations: 0 }

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
            <h2 className='text-2xl font-bold tracking-tight'>Owner Statements</h2>
            <p className='text-muted-foreground'>
              Financial performance breakdown per property.
            </p>
          </div>
          <Select value={String(months)} onValueChange={(v) => { setMonths(Number(v)); setExpandedId(null) }}>
            <SelectTrigger className='w-[150px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='1'>Last month</SelectItem>
              <SelectItem value='3'>Last 3 months</SelectItem>
              <SelectItem value='6'>Last 6 months</SelectItem>
              <SelectItem value='12'>Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary stats */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Revenue</CardTitle>
              <ArrowUpRight className='h-4 w-4 text-green-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-green-600'>{fmtCurrency(totals.revenue)}</div>
              <p className='text-xs text-muted-foreground'>{totals.reservations} reservations</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Expenses</CardTitle>
              <ArrowDownRight className='h-4 w-4 text-red-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-red-600'>{fmtCurrency(totals.expenses)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Net Income</CardTitle>
              <TrendingUp className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totals.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {fmtCurrency(totals.net)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Properties</CardTitle>
              <Building2 className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{summaries?.length ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Property list */}
        {isLoading ? (
          <div className='flex justify-center py-20'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : !summaries?.length ? (
          <Card className='mt-4'>
            <CardContent className='flex flex-col items-center justify-center py-16'>
              <Wallet className='mb-4 h-12 w-12 text-muted-foreground' />
              <CardTitle className='mb-2'>No data available</CardTitle>
              <CardDescription>
                Add properties and record reservations/expenses to see owner statements.
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className='mt-4 space-y-3'>
            {summaries.map((s) => (
              <Card key={s.propertyId}>
                <button
                  type='button'
                  className='flex w-full items-center justify-between p-4 text-left hover:bg-muted/50'
                  onClick={() => setExpandedId(expandedId === s.propertyId ? null : s.propertyId)}
                >
                  <div className='flex items-center gap-3'>
                    {expandedId === s.propertyId ? (
                      <ChevronDown className='h-4 w-4 text-muted-foreground' />
                    ) : (
                      <ChevronRight className='h-4 w-4 text-muted-foreground' />
                    )}
                    <div>
                      <p className='font-medium'>{s.propertyName}</p>
                      <p className='text-sm text-muted-foreground'>
                        {s.reservationCount} reservation{s.reservationCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-6 text-sm'>
                    <div className='text-right'>
                      <p className='text-muted-foreground'>Revenue</p>
                      <p className='font-medium text-green-600'>{fmtCurrency(s.revenue, s.currency)}</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-muted-foreground'>Expenses</p>
                      <p className='font-medium text-red-600'>{fmtCurrency(s.expenses, s.currency)}</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-muted-foreground'>Net</p>
                      <p className={`font-semibold ${s.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {fmtCurrency(s.netIncome, s.currency)}
                      </p>
                    </div>
                  </div>
                </button>

                {expandedId === s.propertyId && (
                  <>
                    <Separator />
                    <div className='px-4'>
                      <PropertyDetail propertyId={s.propertyId} />
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>
        )}
      </Main>
    </>
  )
}
