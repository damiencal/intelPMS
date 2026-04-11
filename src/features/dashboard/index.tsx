import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  Building2,
  CalendarCheck,
  DollarSign,
  Receipt,
  Star,
  Loader2,
  Link2,
  Wrench,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
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
import { ActivityFeed } from './components/activity-feed'
import { Overview } from './components/overview'
import { RecentSales } from './components/recent-sales'
import { useMaintenanceStats } from '@/features/maintenance/api'
import { useExpenseSummary } from '@/features/expenses/api'

interface DashboardResponse {
  data: {
    properties: number
    listings: number
    totalReservations: number
    revenue: { currentMonth: number; lastMonth: number }
    upcoming: { checkIns: number; checkOuts: number }
    pendingProposals: number
    recentActivity: unknown[]
  }
}

function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardResponse>('/analytics/dashboard'),
    select: (res) => res.data,
  })
}

export function Dashboard() {
  const { data, isLoading } = useDashboard()
  const { data: maintenanceStats } = useMaintenanceStats()
  const { data: expenseSummary } = useExpenseSummary(1)

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
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
            <p className='text-muted-foreground'>
              Your property management overview
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <Button variant='outline' asChild>
              <Link to='/settings/connections'>
                <Link2 className='mr-2 h-4 w-4' />
                Connections
              </Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center py-20'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : (
          <div className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Monthly Revenue
                  </CardTitle>
                  <DollarSign className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    ${(data?.revenue.currentMonth ?? 0).toLocaleString()}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    {data?.revenue.lastMonth
                      ? `${((((data.revenue.currentMonth - data.revenue.lastMonth) / data.revenue.lastMonth) * 100) || 0).toFixed(1)}% from last month`
                      : 'No data last month'}
                  </p>
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
                    {data?.properties ?? 0}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    {data?.listings ?? 0} active listings
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Reservations
                  </CardTitle>
                  <CalendarCheck className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {data?.totalReservations ?? 0}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    {data?.upcoming.checkIns ?? 0} check-ins this week
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Upcoming
                  </CardTitle>
                  <Star className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {(data?.upcoming.checkIns ?? 0) + (data?.upcoming.checkOuts ?? 0)}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    {data?.upcoming.checkOuts ?? 0} check-outs · {data?.pendingProposals ?? 0} pending proposals
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats Row */}
            <div className='grid gap-4 sm:grid-cols-3'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Open Maintenance</CardTitle>
                  <Wrench className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {(maintenanceStats?.open ?? 0) + (maintenanceStats?.inProgress ?? 0)}
                  </div>
                  <div className='mt-1 flex items-center gap-2'>
                    {(maintenanceStats?.urgent ?? 0) > 0 && (
                      <Badge variant='destructive' className='text-xs'>
                        <AlertTriangle className='mr-1 h-3 w-3' />
                        {maintenanceStats?.urgent} urgent
                      </Badge>
                    )}
                    <span className='text-xs text-muted-foreground'>
                      {maintenanceStats?.inProgress ?? 0} in progress
                    </span>
                  </div>
                  <Button variant='link' size='sm' className='mt-1 h-auto p-0' asChild>
                    <Link to='/maintenance'>View all requests →</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Monthly Expenses</CardTitle>
                  <Receipt className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    ${(expenseSummary?.total ?? 0).toLocaleString()}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    {expenseSummary?.byCategory.length ?? 0} categories
                  </p>
                  <Button variant='link' size='sm' className='mt-1 h-auto p-0' asChild>
                    <Link to='/expenses'>Manage expenses →</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Pending Proposals</CardTitle>
                  <Star className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {data?.pendingProposals ?? 0}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Pricing proposals awaiting action
                  </p>
                  <Button variant='link' size='sm' className='mt-1 h-auto p-0' asChild>
                    <Link to='/pricing/proposals'>Review proposals →</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
              <Card className='col-span-1 lg:col-span-4'>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                </CardHeader>
                <CardContent className='ps-2'>
                  <Overview />
                </CardContent>
              </Card>
              <Card className='col-span-1 lg:col-span-3'>
                <CardHeader>
                  <CardTitle>Recent Reservations</CardTitle>
                  <CardDescription>
                    Latest booking activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentSales />
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest events across your properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityFeed />
              </CardContent>
            </Card>
          </div>
        )}
      </Main>
    </>
  )
}
