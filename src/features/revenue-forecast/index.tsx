import { useState } from 'react'
import {
  BarChart3,
  Building2,
  DollarSign,
  Loader2,
  TrendingDown,
  TrendingUp,
  CalendarDays,
  BedDouble,
} from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  useRevenueForecast,
  useRevenueByProperty,
  useOccupancyTrends,
  type ForecastMonth,
  type PropertyBreakdown,
} from './api'

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
}

function formatMonth(m: string) {
  const [year, month] = m.split('-')
  const date = new Date(Number(year), Number(month) - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function RevenueForecast() {
  const [forecastMonths, setForecastMonths] = useState(12)
  const [year, setYear] = useState(new Date().getFullYear())

  const { data: forecastData, isLoading } = useRevenueForecast({ months: forecastMonths })
  const { data: propertyData } = useRevenueByProperty(year)
  const { data: occupancyData } = useOccupancyTrends(12)

  const months = forecastData?.data?.months ?? []
  const summary = forecastData?.data?.summary
  const properties: PropertyBreakdown[] = propertyData?.data ?? []
  const occupancy = occupancyData?.data ?? []

  const maxRevenue = Math.max(...months.map((m) => m.revenue), 1)

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
            <h2 className='text-2xl font-bold tracking-tight'>Revenue Forecast</h2>
            <p className='text-muted-foreground'>Revenue projections, property breakdown, and occupancy trends.</p>
          </div>
          <Select value={String(forecastMonths)} onValueChange={(v) => setForecastMonths(Number(v))}>
            <SelectTrigger className='w-[160px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='6'>6 months ahead</SelectItem>
              <SelectItem value='12'>12 months ahead</SelectItem>
              <SelectItem value='18'>18 months ahead</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className='flex justify-center py-12'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            {summary && (
              <div className='mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                <Card>
                  <CardHeader className='pb-2'>
                    <CardDescription>Avg Monthly Revenue</CardDescription>
                    <CardTitle className='text-2xl'>{formatCurrency(summary.avgMonthlyRevenue)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DollarSign className='h-4 w-4 text-green-500' />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className='pb-2'>
                    <CardDescription>Avg Monthly Net</CardDescription>
                    <CardTitle className={`text-2xl ${summary.avgMonthlyNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(summary.avgMonthlyNet)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {summary.avgMonthlyNet >= 0 ? (
                      <TrendingUp className='h-4 w-4 text-green-500' />
                    ) : (
                      <TrendingDown className='h-4 w-4 text-red-500' />
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className='pb-2'>
                    <CardDescription>Projected Annual Revenue</CardDescription>
                    <CardTitle className='text-2xl'>{formatCurrency(summary.projectedAnnualRevenue)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BarChart3 className='h-4 w-4 text-blue-500' />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className='pb-2'>
                    <CardDescription>Total Bookings</CardDescription>
                    <CardTitle className='text-2xl'>{summary.totalBookings}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CalendarDays className='h-4 w-4 text-muted-foreground' />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Monthly Revenue Chart (bar chart) */}
            <Card className='mb-6'>
              <CardHeader>
                <CardTitle>Monthly Revenue & Expenses</CardTitle>
                <CardDescription>Historical + projected. Shaded bars are forecasted.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  {months.map((m: ForecastMonth) => (
                    <div key={m.month} className='flex items-center gap-3'>
                      <div className='w-20 shrink-0 text-xs text-muted-foreground'>{formatMonth(m.month)}</div>
                      <div className='flex-1 space-y-1'>
                        <div className='flex items-center gap-2'>
                          <div
                            className={`h-4 rounded ${m.isForecast ? 'bg-green-300/60' : 'bg-green-500'}`}
                            style={{ width: `${(m.revenue / maxRevenue) * 100}%`, minWidth: m.revenue > 0 ? '4px' : '0' }}
                          />
                          <span className='text-xs'>{formatCurrency(m.revenue)}</span>
                          {m.isForecast && <Badge variant='outline' className='text-[10px] px-1 py-0'>Forecast</Badge>}
                        </div>
                        {m.expenses > 0 && (
                          <div className='flex items-center gap-2'>
                            <div
                              className={`h-2 rounded ${m.isForecast ? 'bg-red-300/60' : 'bg-red-400'}`}
                              style={{ width: `${(m.expenses / maxRevenue) * 100}%`, minWidth: '4px' }}
                            />
                            <span className='text-xs text-muted-foreground'>{formatCurrency(m.expenses)}</span>
                          </div>
                        )}
                      </div>
                      <div className={`w-24 text-right text-sm font-medium ${m.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(m.netIncome)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Occupancy Trends */}
            {occupancy.length > 0 && (
              <Card className='mb-6'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <BedDouble className='h-5 w-5' /> Occupancy Trends
                  </CardTitle>
                  <CardDescription>Monthly occupancy rates across all properties</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    {occupancy.map((o) => (
                      <div key={o.month} className='flex items-center gap-3'>
                        <div className='w-20 shrink-0 text-xs text-muted-foreground'>{formatMonth(o.month)}</div>
                        <div className='flex-1'>
                          <div className='h-5 w-full rounded bg-muted'>
                            <div
                              className={`h-5 rounded ${o.occupancyRate >= 70 ? 'bg-green-500' : o.occupancyRate >= 40 ? 'bg-yellow-500' : 'bg-red-400'}`}
                              style={{ width: `${Math.min(o.occupancyRate, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className='w-14 text-right text-sm font-medium'>{o.occupancyRate}%</div>
                        <div className='w-24 text-right text-xs text-muted-foreground'>
                          {o.bookedNights}/{o.totalNights} nights
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Per-Property Breakdown */}
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle className='flex items-center gap-2'>
                      <Building2 className='h-5 w-5' /> Revenue by Property
                    </CardTitle>
                    <CardDescription>Year {year} performance per property</CardDescription>
                  </div>
                  <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                    <SelectTrigger className='w-[120px]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026, 2027].map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead className='text-right'>Revenue</TableHead>
                      <TableHead className='text-right'>Expenses</TableHead>
                      <TableHead className='text-right'>Net Income</TableHead>
                      <TableHead className='text-right'>Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {properties.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className='text-center text-muted-foreground py-8'>
                          No revenue data for {year}.
                        </TableCell>
                      </TableRow>
                    ) : (
                      properties.map((p: PropertyBreakdown) => (
                        <TableRow key={p.propertyId}>
                          <TableCell className='font-medium'>{p.propertyName}</TableCell>
                          <TableCell className='text-right'>{formatCurrency(p.revenue)}</TableCell>
                          <TableCell className='text-right'>{formatCurrency(p.expenses)}</TableCell>
                          <TableCell className={`text-right font-medium ${p.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(p.netIncome)}
                          </TableCell>
                          <TableCell className='text-right'>
                            <Badge variant={p.margin >= 50 ? 'default' : p.margin >= 0 ? 'secondary' : 'destructive'}>
                              {p.margin}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </Main>
    </>
  )
}
