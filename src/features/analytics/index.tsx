import { useQuery } from '@tanstack/react-query'
import {
  Loader2,
  BarChart3,
  TrendingUp,
  Building2,
  CalendarDays,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Link } from '@tanstack/react-router'

interface OccupancyData {
  propertyId: string
  propertyName: string
  totalDays: number
  bookedDays: number
  occupancyRate: number
  averageDailyRate: number
}

interface OccupancyResponse {
  data: OccupancyData[]
}

const OCCUPANCY_COLORS = ['#22c55e', '#3b82f6', '#eab308', '#f97316', '#ef4444']

function getOccupancyColor(rate: number): string {
  if (rate >= 80) return OCCUPANCY_COLORS[0]
  if (rate >= 60) return OCCUPANCY_COLORS[1]
  if (rate >= 40) return OCCUPANCY_COLORS[2]
  if (rate >= 20) return OCCUPANCY_COLORS[3]
  return OCCUPANCY_COLORS[4]
}

export function Analytics() {
  const { data: occupancyData, isLoading } = useQuery({
    queryKey: ['analytics', 'occupancy'],
    queryFn: () => api.get<OccupancyResponse>('/analytics/occupancy'),
    select: (res) => res.data,
  })

  const avgOccupancy = occupancyData && occupancyData.length > 0
    ? occupancyData.reduce((sum, p) => sum + p.occupancyRate, 0) / occupancyData.length
    : 0

  const avgAdr = occupancyData && occupancyData.length > 0
    ? occupancyData.reduce((sum, p) => sum + p.averageDailyRate, 0) / occupancyData.length
    : 0

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
        <div className='mb-4'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            Analytics
          </h1>
          <p className='text-muted-foreground'>
            Revenue, occupancy, and performance analytics.
          </p>
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center py-20'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : !occupancyData || occupancyData.length === 0 ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-16'>
              <BarChart3 className='h-16 w-16 text-muted-foreground/50' />
              <h2 className='mt-4 text-xl font-semibold'>No analytics data yet</h2>
              <p className='mt-2 max-w-md text-center text-sm text-muted-foreground'>
                Connect your Hostex account and sync properties to see analytics.
              </p>
              <Button className='mt-6' variant='outline' asChild>
                <Link to='/settings/connections'>Go to Connections</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-6'>
            {/* Summary cards */}
            <div className='grid gap-4 sm:grid-cols-3'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Avg Occupancy (90d)</CardTitle>
                  <CalendarDays className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {avgOccupancy.toFixed(1)}%
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Across {occupancyData.length} properties
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Avg Daily Rate</CardTitle>
                  <TrendingUp className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    ${avgAdr.toFixed(0)}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Next 90 days weighted average
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Properties</CardTitle>
                  <Building2 className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{occupancyData.length}</div>
                  <p className='text-xs text-muted-foreground'>
                    With calendar data available
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Occupancy by Property Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Occupancy by Property (Next 90 Days)</CardTitle>
                <CardDescription>Percentage of booked nights per property</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={Math.max(200, occupancyData.length * 50)}>
                  <BarChart data={occupancyData} layout='vertical'>
                    <XAxis
                      type='number'
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                      stroke='#888888'
                      fontSize={12}
                    />
                    <YAxis
                      type='category'
                      dataKey='propertyName'
                      stroke='#888888'
                      fontSize={12}
                      width={180}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Occupancy']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Bar dataKey='occupancyRate' radius={[0, 4, 4, 0]}>
                      {occupancyData.map((entry, idx) => (
                        <Cell key={idx} fill={getOccupancyColor(entry.occupancyRate)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Property Detail Table */}
            <Card>
              <CardHeader>
                <CardTitle>Property Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {occupancyData.map((prop) => (
                    <div key={prop.propertyId} className='flex items-center justify-between rounded-lg border p-3'>
                      <div>
                        <Link
                          to='/properties/$propertyId'
                          params={{ propertyId: prop.propertyId }}
                          className='font-medium hover:underline'
                        >
                          {prop.propertyName}
                        </Link>
                        <p className='text-sm text-muted-foreground'>
                          {prop.bookedDays} / {prop.totalDays} nights booked
                        </p>
                      </div>
                      <div className='flex items-center gap-4'>
                        <div className='text-right'>
                          <p className='text-sm font-medium'>${prop.averageDailyRate.toFixed(0)} ADR</p>
                        </div>
                        <Badge
                          variant={prop.occupancyRate >= 60 ? 'default' : prop.occupancyRate >= 30 ? 'secondary' : 'destructive'}
                          className={prop.occupancyRate >= 60 ? 'bg-green-600' : ''}
                        >
                          {prop.occupancyRate.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Main>
    </>
  )
}
