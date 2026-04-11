import {
  Building2,
  CalendarCheck,
  DollarSign,
  Loader2,
  Star,
  TrendingUp,
  Wrench,
  BarChart3,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { usePortfolio } from './api'

export default function PortfolioPage() {
  const { data, isLoading } = usePortfolio()

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(v)

  if (isLoading) {
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
          <div className='flex justify-center py-20'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        </Main>
      </>
    )
  }

  const summary = data?.summary
  const properties = data?.properties ?? []
  const rankings = data?.rankings

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
        <div className='mb-4'>
          <h2 className='text-2xl font-bold tracking-tight'>Portfolio Dashboard</h2>
          <p className='text-muted-foreground'>
            Multi-property overview with aggregated performance metrics.
          </p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className='mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Properties</CardTitle>
                <Building2 className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{summary.totalProperties}</div>
                <p className='text-muted-foreground text-xs'>
                  {summary.totalReservations} total reservations
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Total Revenue</CardTitle>
                <DollarSign className='text-green-500 h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {formatCurrency(summary.totalRevenue)}
                </div>
                <p className='text-muted-foreground text-xs'>
                  {formatCurrency(summary.recentRevenue)} last 30d
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Net Income</CardTitle>
                <TrendingUp className='text-blue-500 h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {formatCurrency(summary.totalNetIncome)}
                </div>
                <p className='text-muted-foreground text-xs'>
                  Expenses: {formatCurrency(summary.totalExpenses)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium'>Avg Occupancy</CardTitle>
                <CalendarCheck className='text-purple-500 h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{summary.avgOccupancy}%</div>
                <p className='text-muted-foreground text-xs'>
                  {summary.avgRating != null
                    ? `⭐ ${summary.avgRating} avg rating`
                    : 'No ratings yet'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Rankings */}
        {rankings && (
          <div className='mb-6 grid gap-4 md:grid-cols-3'>
            <Card>
              <CardHeader>
                <CardTitle className='text-sm font-medium'>Top by Revenue</CardTitle>
                <CardDescription>Highest earning properties</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  {rankings.topByRevenue.map((p, i) => (
                    <div
                      key={p.id}
                      className='flex items-center justify-between text-sm'
                    >
                      <span>
                        <Badge variant='outline' className='mr-2'>
                          #{i + 1}
                        </Badge>
                        {p.name}
                      </span>
                      <span className='font-medium'>
                        {formatCurrency(p.value)}
                      </span>
                    </div>
                  ))}
                  {rankings.topByRevenue.length === 0 && (
                    <p className='text-sm text-muted-foreground'>No data</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className='text-sm font-medium'>Top by Occupancy</CardTitle>
                <CardDescription>Highest occupancy rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  {rankings.topByOccupancy.map((p, i) => (
                    <div
                      key={p.id}
                      className='flex items-center justify-between text-sm'
                    >
                      <span>
                        <Badge variant='outline' className='mr-2'>
                          #{i + 1}
                        </Badge>
                        {p.name}
                      </span>
                      <span className='font-medium'>{p.value}%</span>
                    </div>
                  ))}
                  {rankings.topByOccupancy.length === 0 && (
                    <p className='text-sm text-muted-foreground'>No data</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className='text-sm font-medium'>Top by Rating</CardTitle>
                <CardDescription>Best rated properties</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  {rankings.topByRating.map((p, i) => (
                    <div
                      key={p.id}
                      className='flex items-center justify-between text-sm'
                    >
                      <span>
                        <Badge variant='outline' className='mr-2'>
                          #{i + 1}
                        </Badge>
                        {p.name}
                      </span>
                      <span className='flex items-center font-medium'>
                        <Star className='mr-1 h-3 w-3 text-yellow-500' />
                        {p.value}
                      </span>
                    </div>
                  ))}
                  {rankings.topByRating.length === 0 && (
                    <p className='text-sm text-muted-foreground'>No data</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Properties Table */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BarChart3 className='h-5 w-5' />
              Property Performance
            </CardTitle>
            <CardDescription>
              Detailed metrics for each property in your portfolio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead className='text-right'>Revenue</TableHead>
                    <TableHead className='text-right'>Expenses</TableHead>
                    <TableHead className='text-right'>Net</TableHead>
                    <TableHead className='text-right'>Occupancy</TableHead>
                    <TableHead className='text-right'>Rating</TableHead>
                    <TableHead className='text-right'>Reservations</TableHead>
                    <TableHead className='text-right'>Avg Rate</TableHead>
                    <TableHead className='text-right'>
                      <Wrench className='inline h-3 w-3' /> Open
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className='py-8 text-center text-muted-foreground'
                      >
                        No properties found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    properties.map((prop) => (
                      <TableRow key={prop.id}>
                        <TableCell className='font-medium'>
                          {prop.name}
                          {prop.address && (
                            <span className='block text-xs text-muted-foreground'>
                              {prop.address}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className='text-right'>
                          {formatCurrency(prop.totalRevenue)}
                          <span className='block text-xs text-muted-foreground'>
                            {formatCurrency(prop.recentRevenue)} 30d
                          </span>
                        </TableCell>
                        <TableCell className='text-right'>
                          {formatCurrency(prop.totalExpenses)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${prop.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {formatCurrency(prop.netIncome)}
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex items-center justify-end gap-1'>
                            <div className='h-1.5 w-12 overflow-hidden rounded-full bg-muted'>
                              <div
                                className='h-full rounded-full bg-purple-500'
                                style={{ width: `${Math.min(100, prop.occupancyRate)}%` }}
                              />
                            </div>
                            <span className='text-xs'>{prop.occupancyRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell className='text-right'>
                          {prop.avgRating != null ? (
                            <span className='flex items-center justify-end gap-0.5'>
                              <Star className='h-3 w-3 text-yellow-500' />
                              {prop.avgRating}
                              <span className='text-xs text-muted-foreground'>
                                ({prop.reviewCount})
                              </span>
                            </span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className='text-right'>
                          {prop.totalReservations}
                          <span className='block text-xs text-muted-foreground'>
                            {prop.recentReservations} recent
                          </span>
                        </TableCell>
                        <TableCell className='text-right'>
                          {formatCurrency(prop.avgNightlyRate)}
                        </TableCell>
                        <TableCell className='text-right'>
                          {prop.openMaintenance > 0 ? (
                            <Badge variant='destructive'>{prop.openMaintenance}</Badge>
                          ) : (
                            <Badge variant='secondary'>0</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </Main>
    </>
  )
}
