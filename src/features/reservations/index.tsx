import { useState } from 'react'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  Home,
  Loader2,
  Search as SearchIcon,
  User,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import type { Reservation } from './api'
import { useReservations, useUpcomingReservations } from './api'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

function statusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'confirmed':
      return 'default'
    case 'pending':
      return 'secondary'
    case 'cancelled':
      return 'destructive'
    default:
      return 'outline'
  }
}

function ReservationRow({ r }: { r: Reservation }) {
  const nights = Math.max(
    1,
    Math.round(
      (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  )
  return (
    <TableRow>
      <TableCell className='font-medium'>
        {r.guestName ?? 'Unknown'}
        {r.numGuests && (
          <span className='ml-2 text-xs text-muted-foreground'>
            ({r.numGuests} guests)
          </span>
        )}
      </TableCell>
      <TableCell>{r.property.name}</TableCell>
      <TableCell>{formatDate(r.checkIn)}</TableCell>
      <TableCell>{formatDate(r.checkOut)}</TableCell>
      <TableCell className='text-center'>{nights}</TableCell>
      <TableCell>
        <Badge variant={statusVariant(r.status)} className='capitalize'>
          {r.status}
        </Badge>
      </TableCell>
      <TableCell className='text-right'>
        {r.totalPrice != null
          ? formatCurrency(r.totalPrice, r.currency)
          : '—'}
      </TableCell>
      <TableCell className='capitalize'>{r.channel ?? '—'}</TableCell>
    </TableRow>
  )
}

function GuestCard({ r, type }: { r: Reservation; type: 'in' | 'out' | 'staying' }) {
  return (
    <div className='flex items-start gap-3 rounded-lg border p-3'>
      <div
        className={`mt-0.5 rounded-full p-1.5 ${
          type === 'in'
            ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
            : type === 'out'
              ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400'
              : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
        }`}
      >
        {type === 'in' ? (
          <ArrowDownCircle className='h-4 w-4' />
        ) : type === 'out' ? (
          <ArrowUpCircle className='h-4 w-4' />
        ) : (
          <Home className='h-4 w-4' />
        )}
      </div>
      <div className='flex-1'>
        <div className='flex items-center justify-between'>
          <span className='font-medium'>{r.guestName ?? 'Unknown Guest'}</span>
          {r.numGuests && (
            <span className='text-xs text-muted-foreground'>
              <Users className='mr-1 inline h-3 w-3' />
              {r.numGuests}
            </span>
          )}
        </div>
        <p className='text-sm text-muted-foreground'>{r.property.name}</p>
        <p className='mt-1 text-xs text-muted-foreground'>
          {formatDate(r.checkIn)} → {formatDate(r.checkOut)}
          {r.channel && ` · ${r.channel}`}
        </p>
      </div>
    </div>
  )
}

export function Reservations() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [page, setPage] = useState(1)

  const { data: upcoming, isLoading: upcomingLoading } =
    useUpcomingReservations(7)

  const { data: listData, isLoading: listLoading } = useReservations({
    page,
    perPage: 20,
    status: status === 'all' ? undefined : status,
    search: search || undefined,
  })

  const reservations = listData?.data ?? []
  const meta = listData?.meta

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
        <div className='mb-2'>
          <h1 className='text-2xl font-bold tracking-tight'>Reservations</h1>
          <p className='text-muted-foreground'>
            Guest check-ins, check-outs, and booking management
          </p>
        </div>

        <Tabs defaultValue='tracker'>
          <TabsList>
            <TabsTrigger value='tracker'>Guest Tracker</TabsTrigger>
            <TabsTrigger value='all'>All Reservations</TabsTrigger>
          </TabsList>

          {/* Guest Tracker Tab */}
          <TabsContent value='tracker' className='space-y-6'>
            {upcomingLoading ? (
              <div className='flex items-center justify-center py-20'>
                <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Check-ins Today
                      </CardTitle>
                      <ArrowDownCircle className='h-4 w-4 text-green-500' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {upcoming?.summary.todayCheckIns ?? 0}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Check-outs Today
                      </CardTitle>
                      <ArrowUpCircle className='h-4 w-4 text-orange-500' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {upcoming?.summary.todayCheckOuts ?? 0}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Current Guests
                      </CardTitle>
                      <User className='h-4 w-4 text-blue-500' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {upcoming?.summary.currentGuestsCount ?? 0}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        Upcoming (7 days)
                      </CardTitle>
                      <CalendarDays className='h-4 w-4 text-muted-foreground' />
                    </CardHeader>
                    <CardContent>
                      <div className='text-2xl font-bold'>
                        {upcoming?.summary.upcomingCheckIns ?? 0}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Current Guests */}
                <Card>
                  <CardHeader>
                    <CardTitle>Current Guests</CardTitle>
                    <CardDescription>
                      Guests currently staying at your properties
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {upcoming?.currentGuests.length ? (
                      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                        {upcoming.currentGuests.map((r) => (
                          <GuestCard key={r.id} r={r} type='staying' />
                        ))}
                      </div>
                    ) : (
                      <p className='py-4 text-center text-sm text-muted-foreground'>
                        No current guests
                      </p>
                    )}
                  </CardContent>
                </Card>

                <div className='grid gap-4 lg:grid-cols-2'>
                  {/* Upcoming Check-ins */}
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <ArrowDownCircle className='h-4 w-4 text-green-500' />
                        Upcoming Check-ins
                      </CardTitle>
                      <CardDescription>Next 7 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {upcoming?.checkIns.length ? (
                        <div className='space-y-3'>
                          {upcoming.checkIns.map((r) => (
                            <GuestCard key={r.id} r={r} type='in' />
                          ))}
                        </div>
                      ) : (
                        <p className='py-4 text-center text-sm text-muted-foreground'>
                          No upcoming check-ins
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Upcoming Check-outs */}
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <ArrowUpCircle className='h-4 w-4 text-orange-500' />
                        Upcoming Check-outs
                      </CardTitle>
                      <CardDescription>Next 7 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {upcoming?.checkOuts.length ? (
                        <div className='space-y-3'>
                          {upcoming.checkOuts.map((r) => (
                            <GuestCard key={r.id} r={r} type='out' />
                          ))}
                        </div>
                      ) : (
                        <p className='py-4 text-center text-sm text-muted-foreground'>
                          No upcoming check-outs
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* All Reservations Tab */}
          <TabsContent value='all' className='space-y-4'>
            <div className='flex flex-wrap items-center gap-3'>
              <div className='relative flex-1'>
                <SearchIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  placeholder='Search guests, confirmation codes...'
                  className='pl-9'
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v)
                  setPage(1)
                }}
              >
                <SelectTrigger className='w-[160px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  <SelectItem value='confirmed'>Confirmed</SelectItem>
                  <SelectItem value='pending'>Pending</SelectItem>
                  <SelectItem value='cancelled'>Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {listLoading ? (
              <div className='flex items-center justify-center py-20'>
                <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
              </div>
            ) : (
              <>
                <div className='overflow-x-auto rounded-md border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Guest</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead className='text-center'>Nights</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className='text-right'>Total</TableHead>
                        <TableHead>Channel</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reservations.length ? (
                        reservations.map((r) => (
                          <ReservationRow key={r.id} r={r} />
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className='py-10 text-center text-muted-foreground'
                          >
                            No reservations found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {meta && meta.totalPages > 1 && (
                  <div className='flex items-center justify-between'>
                    <p className='text-sm text-muted-foreground'>
                      Showing {(meta.page - 1) * meta.perPage + 1}–
                      {Math.min(meta.page * meta.perPage, meta.total)} of{' '}
                      {meta.total}
                    </p>
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= meta.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
