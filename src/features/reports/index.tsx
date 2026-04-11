import { useState } from 'react'
import {
  BarChart3,
  Building2,
  CalendarDays,
  DollarSign,
  FileSpreadsheet,
  Loader2,
  Moon,
  TrendingUp,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
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
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useRevenueReport, useOccupancyReport } from './api'

// ---- Helpers ----

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatMonth(month: string) {
  const [year, m] = month.split('-')
  const date = new Date(Number(year), Number(m) - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

const CHANNEL_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

// ---- Component ----

export function Reports() {
  const [months, setMonths] = useState(12)
  const { data: revenue, isLoading: revLoading } = useRevenueReport(months)
  const { data: occupancy, isLoading: occLoading } = useOccupancyReport(3)

  const isLoading = revLoading || occLoading

  return (
    <>
      <Header>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              Financial Reports
            </h1>
            <p className='text-muted-foreground'>
              Revenue, occupancy, and channel performance
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Link to='/tax-reports'>
              <Button variant='ghost' size='icon' className='h-8 w-8' title='Tax Reports'>
                <FileSpreadsheet size={16} />
              </Button>
            </Link>
            <Select
              value={String(months)}
              onValueChange={(v) => setMonths(Number(v))}
            >
              <SelectTrigger className='w-[140px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='3'>Last 3 months</SelectItem>
                <SelectItem value='6'>Last 6 months</SelectItem>
                <SelectItem value='12'>Last 12 months</SelectItem>
                <SelectItem value='24'>Last 24 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center py-20'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : (
          <div className='space-y-6'>
            {/* Summary Cards */}
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Total Revenue
                  </CardTitle>
                  <DollarSign className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {formatCurrency(revenue?.totals.revenue ?? 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Total Bookings
                  </CardTitle>
                  <CalendarDays className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {revenue?.totals.bookings ?? 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Total Nights
                  </CardTitle>
                  <Moon className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {revenue?.totals.nights ?? 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Avg Nightly Rate
                  </CardTitle>
                  <TrendingUp className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {formatCurrency(revenue?.totals.avgNightlyRate ?? 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Properties
                  </CardTitle>
                  <Building2 className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {revenue?.totals.properties ?? 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
              {/* Monthly Revenue Bar Chart */}
              <Card className='col-span-1 lg:col-span-4'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <BarChart3 className='h-4 w-4' />
                    Monthly Revenue
                  </CardTitle>
                  <CardDescription>Revenue trend over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {revenue?.monthlyRevenue.length ? (
                    <ResponsiveContainer width='100%' height={300}>
                      <BarChart data={revenue.monthlyRevenue}>
                        <XAxis
                          dataKey='month'
                          tickFormatter={formatMonth}
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            formatCurrency(value),
                            'Revenue',
                          ]}
                          labelFormatter={formatMonth}
                        />
                        <Bar
                          dataKey='revenue'
                          fill='hsl(var(--chart-1))'
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className='py-10 text-center text-sm text-muted-foreground'>
                      No revenue data for this period
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Channel Breakdown Pie */}
              <Card className='col-span-1 lg:col-span-3'>
                <CardHeader>
                  <CardTitle>Channel Breakdown</CardTitle>
                  <CardDescription>Bookings by source</CardDescription>
                </CardHeader>
                <CardContent>
                  {revenue?.channelBreakdown.length ? (
                    <div className='flex flex-col items-center gap-4'>
                      <ResponsiveContainer width='100%' height={200}>
                        <PieChart>
                          <Pie
                            data={revenue.channelBreakdown}
                            dataKey='bookings'
                            nameKey='channel'
                            cx='50%'
                            cy='50%'
                            innerRadius={50}
                            outerRadius={80}
                          >
                            {revenue.channelBreakdown.map((_, i) => (
                              <Cell
                                key={i}
                                fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number, _name: string, entry: { payload?: { channel?: string } }) => [
                              `${value} bookings`,
                              entry.payload?.channel ?? '',
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className='flex flex-wrap justify-center gap-3'>
                        {revenue.channelBreakdown.map((ch, i) => (
                          <div
                            key={ch.channel}
                            className='flex items-center gap-1.5 text-sm'
                          >
                            <span
                              className='inline-block h-2.5 w-2.5 rounded-full'
                              style={{
                                backgroundColor:
                                  CHANNEL_COLORS[i % CHANNEL_COLORS.length],
                              }}
                            />
                            <span className='capitalize'>{ch.channel}</span>
                            <span className='text-muted-foreground'>
                              ({formatCurrency(ch.revenue)})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className='py-10 text-center text-sm text-muted-foreground'>
                      No channel data
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Property Breakdown Table */}
            <Card>
              <CardHeader>
                <CardTitle>Property Performance</CardTitle>
                <CardDescription>
                  Revenue and booking metrics per property
                </CardDescription>
              </CardHeader>
              <CardContent>
                {revenue?.propertyBreakdown.length ? (
                  <div className='overflow-x-auto'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Property</TableHead>
                          <TableHead className='text-right'>Revenue</TableHead>
                          <TableHead className='text-right'>Bookings</TableHead>
                          <TableHead className='text-right'>Nights</TableHead>
                          <TableHead className='text-right'>
                            Avg Nightly
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {revenue.propertyBreakdown
                          .sort((a, b) => b.revenue - a.revenue)
                          .map((prop) => (
                            <TableRow key={prop.id}>
                              <TableCell className='font-medium'>
                                {prop.name}
                              </TableCell>
                              <TableCell className='text-right'>
                                {formatCurrency(prop.revenue)}
                              </TableCell>
                              <TableCell className='text-right'>
                                {prop.bookings}
                              </TableCell>
                              <TableCell className='text-right'>
                                {prop.nights}
                              </TableCell>
                              <TableCell className='text-right'>
                                {formatCurrency(prop.avgNightlyRate)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className='py-10 text-center text-sm text-muted-foreground'>
                    No property data
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Occupancy Table */}
            <Card>
              <CardHeader>
                <CardTitle>Occupancy Rates</CardTitle>
                <CardDescription>
                  Property occupancy over the last 3 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                {occupancy?.length ? (
                  <div className='overflow-x-auto'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Property</TableHead>
                          <TableHead className='text-right'>
                            Total Days
                          </TableHead>
                          <TableHead className='text-right'>
                            Booked Days
                          </TableHead>
                          <TableHead className='text-right'>
                            Occupancy
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {occupancy
                          .sort((a, b) => b.occupancyRate - a.occupancyRate)
                          .map((prop) => (
                            <TableRow key={prop.id}>
                              <TableCell className='font-medium'>
                                {prop.name}
                              </TableCell>
                              <TableCell className='text-right'>
                                {prop.totalDays}
                              </TableCell>
                              <TableCell className='text-right'>
                                {prop.bookedDays}
                              </TableCell>
                              <TableCell className='text-right'>
                                <Badge
                                  variant={
                                    prop.occupancyRate >= 70
                                      ? 'default'
                                      : prop.occupancyRate >= 40
                                        ? 'secondary'
                                        : 'destructive'
                                  }
                                >
                                  {prop.occupancyRate}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className='py-10 text-center text-sm text-muted-foreground'>
                    No occupancy data
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </Main>
    </>
  )
}
