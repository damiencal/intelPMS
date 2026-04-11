import { useState, useMemo } from 'react'
import {
  Building2,
  MapPin,
  Star,
  CalendarDays,
  Loader2,
  ArrowLeft,
  Clock,
  ExternalLink,
  Bed,
  Users,
  DollarSign,
  TrendingUp,
  Hash,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { cn } from '@/lib/utils'
import type { CalendarEntry, PropertyListingFull, Reservation, Review } from '../api'
import {
  useProperty,
  usePropertyReservations,
  usePropertyReviews,
  usePropertyCalendar,
} from '../api'
import { ConciergeTab } from './concierge-tab'

// ---- Color maps ----

const channelColors: Record<string, string> = {
  airbnb: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  booking: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  vrbo: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  direct: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
}

const statusColors: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  checked_in: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
}

const sentimentColors: Record<string, string> = {
  positive: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  negative: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
}

// ---- Helpers ----

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateShort(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function formatCurrency(amount: number | null, currency = 'USD') {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
    amount
  )
}

function nightsBetween(checkIn: string, checkOut: string) {
  const diff =
    new Date(checkOut).getTime() - new Date(checkIn).getTime()
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)))
}

// ---- Stat Card ----

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
}) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <Icon className='h-4 w-4 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        {subtitle && (
          <p className='text-xs text-muted-foreground'>{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ---- Listings Section ----

function ListingsSection({
  listings,
  currency,
}: {
  listings: PropertyListingFull[]
  currency: string
}) {
  if (listings.length === 0) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-10'>
          <Bed className='h-10 w-10 text-muted-foreground/50' />
          <p className='mt-2 text-sm text-muted-foreground'>
            No channel listings connected yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {listings.map((listing) => (
        <Card key={listing.id} className='relative overflow-hidden'>
          <div
            className={cn(
              'absolute left-0 top-0 h-full w-1',
              listing.isActive ? 'bg-green-500' : 'bg-gray-300'
            )}
          />
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <Badge
                variant='secondary'
                className={channelColors[listing.channel] ?? ''}
              >
                {listing.channelName || listing.channel}
              </Badge>
              {listing.isActive ? (
                <Badge variant='default' className='bg-green-600'>
                  Active
                </Badge>
              ) : (
                <Badge variant='secondary'>Inactive</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className='space-y-2'>
            {listing.basePrice != null && (
              <div className='flex items-center gap-2 text-sm'>
                <DollarSign className='h-3.5 w-3.5 text-muted-foreground' />
                <span>
                  Base price:{' '}
                  <span className='font-medium'>
                    {formatCurrency(listing.basePrice, listing.currency || currency)}
                  </span>
                </span>
              </div>
            )}
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Hash className='h-3.5 w-3.5' />
              <span className='truncate font-mono text-xs'>{listing.hostexId}</span>
            </div>
            {listing.listingUrl && (
              <a
                href={listing.listingUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1 text-sm text-primary hover:underline'
              >
                <ExternalLink className='h-3.5 w-3.5' />
                View on {listing.channelName || listing.channel}
              </a>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ---- Reservations Table ----

function ReservationsTable({
  reservations,
  meta,
  page,
  setPage,
  currency,
}: {
  reservations: Reservation[]
  meta?: { total: number; page: number; perPage: number; totalPages: number }
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
  currency: string
}) {
  if (reservations.length === 0) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-10'>
          <CalendarDays className='h-10 w-10 text-muted-foreground/50' />
          <p className='mt-2 text-sm text-muted-foreground'>
            No reservations yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reservations</CardTitle>
        <CardDescription>{meta?.total ?? 0} total reservations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Nights</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Confirmation</TableHead>
                <TableHead className='text-right'>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((res) => (
                <TableRow key={res.id}>
                  <TableCell>
                    <div className='max-w-[180px]'>
                      <p className='font-medium truncate'>
                        {res.guestName || 'Guest'}
                      </p>
                      {res.guestEmail && (
                        <p className='flex items-center gap-1 text-xs text-muted-foreground truncate'>
                          <Mail className='h-3 w-3 flex-shrink-0' />
                          {res.guestEmail}
                        </p>
                      )}
                      {res.guestPhone && (
                        <p className='flex items-center gap-1 text-xs text-muted-foreground'>
                          <Phone className='h-3 w-3 flex-shrink-0' />
                          {res.guestPhone}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className='whitespace-nowrap'>
                    <div className='text-sm'>
                      {formatDateShort(res.checkIn)} → {formatDateShort(res.checkOut)}
                    </div>
                  </TableCell>
                  <TableCell className='text-center'>
                    {nightsBetween(res.checkIn, res.checkOut)}
                  </TableCell>
                  <TableCell className='text-center'>
                    {res.numGuests ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant='secondary'
                      className={statusColors[res.status] ?? ''}
                    >
                      {res.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className='capitalize'>
                    {res.channel ?? '—'}
                  </TableCell>
                  <TableCell>
                    {res.confirmationCode ? (
                      <code className='rounded bg-muted px-1.5 py-0.5 text-xs font-mono'>
                        {res.confirmationCode}
                      </code>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className='text-right font-medium'>
                    {formatCurrency(res.totalPrice, res.currency || currency)}
                  </TableCell>
                </TableRow>
              ))}
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
                <ChevronLeft className='mr-1 h-4 w-4' />
                Previous
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className='ml-1 h-4 w-4' />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---- Reviews List ----

function ReviewsList({
  reviews,
  meta,
  page,
  setPage,
}: {
  reviews: Review[]
  meta?: { total: number; page: number; perPage: number; totalPages: number }
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
}) {
  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-10'>
          <Star className='h-10 w-10 text-muted-foreground/50' />
          <p className='mt-2 text-sm text-muted-foreground'>
            No reviews yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  const avgRating =
    reviews.filter((r) => r.rating != null).reduce((sum, r) => sum + (r.rating ?? 0), 0) /
    (reviews.filter((r) => r.rating != null).length || 1)

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Reviews</CardTitle>
            <CardDescription>{meta?.total ?? 0} total reviews</CardDescription>
          </div>
          {reviews.some((r) => r.rating != null) && (
            <div className='flex items-center gap-1 text-lg font-semibold'>
              <Star className='h-5 w-5 fill-yellow-400 text-yellow-400' />
              {avgRating.toFixed(1)}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {reviews.map((review) => (
            <div key={review.id} className='rounded-lg border p-4'>
              <div className='flex items-start justify-between gap-2'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <span className='font-medium'>
                    {review.guestName || 'Guest'}
                  </span>
                  {review.rating != null && (
                    <span className='flex items-center gap-0.5 text-sm'>
                      <Star className='h-3.5 w-3.5 fill-yellow-400 text-yellow-400' />
                      {review.rating}
                    </span>
                  )}
                  {review.sentiment && (
                    <Badge
                      variant='secondary'
                      className={sentimentColors[review.sentiment] ?? ''}
                    >
                      {review.sentiment}
                    </Badge>
                  )}
                  {review.channel && (
                    <Badge variant='outline' className='capitalize'>
                      {review.channel}
                    </Badge>
                  )}
                </div>
                <span className='whitespace-nowrap text-sm text-muted-foreground'>
                  {formatDate(review.reviewDate)}
                </span>
              </div>
              {review.content && (
                <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>
                  {review.content}
                </p>
              )}
              <Separator className='my-3' />
              <div className='flex items-center justify-between'>
                <Badge
                  variant={
                    review.responseStatus === 'responded' ? 'default' : 'outline'
                  }
                >
                  {review.responseStatus.replace(/_/g, ' ')}
                </Badge>
                {review.respondedAt && (
                  <span className='text-xs text-muted-foreground'>
                    Responded {formatDate(review.respondedAt)}
                  </span>
                )}
              </div>
              {review.responseDraft && (
                <div className='mt-2 rounded-md bg-muted/50 p-3'>
                  <p className='text-xs font-medium text-muted-foreground mb-1'>
                    Response draft:
                  </p>
                  <p className='text-sm'>{review.responseDraft}</p>
                </div>
              )}
            </div>
          ))}
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
                <ChevronLeft className='mr-1 h-4 w-4' />
                Previous
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className='ml-1 h-4 w-4' />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---- Calendar Grid ----

function CalendarGrid({
  entries,
  currency,
}: {
  entries: CalendarEntry[]
  currency: string
}) {
  const [monthOffset, setMonthOffset] = useState(0)

  const now = new Date()
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const monthLabel = viewDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  // Build calendar date → entries lookup
  const entryMap = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>()
    for (const entry of entries) {
      const d = new Date(entry.date).toISOString().split('T')[0]
      if (!map.has(d)) map.set(d, [])
      map.get(d)!.push(entry)
    }
    return map
  }, [entries])

  // Days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay() // 0=Sun

  const days: (number | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Availability Calendar</CardTitle>
            <CardDescription>
              Pricing and availability — {monthLabel}
            </CardDescription>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='icon'
              className='h-8 w-8'
              disabled={monthOffset <= 0}
              onClick={() => setMonthOffset((m) => m - 1)}
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setMonthOffset(0)}
              disabled={monthOffset === 0}
            >
              Today
            </Button>
            <Button
              variant='outline'
              size='icon'
              className='h-8 w-8'
              disabled={monthOffset >= 2}
              onClick={() => setMonthOffset((m) => m + 1)}
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className='py-6 text-center text-sm text-muted-foreground'>
            No calendar data available.
          </p>
        ) : (
          <>
            {/* Legend */}
            <div className='mb-4 flex flex-wrap gap-4 text-xs text-muted-foreground'>
              <span className='flex items-center gap-1'>
                <span className='inline-block h-3 w-3 rounded-sm bg-green-100 dark:bg-green-900' />
                Available
              </span>
              <span className='flex items-center gap-1'>
                <span className='inline-block h-3 w-3 rounded-sm bg-red-100 dark:bg-red-900' />
                Booked
              </span>
              <span className='flex items-center gap-1'>
                <span className='inline-block h-3 w-3 rounded-sm bg-muted' />
                No data
              </span>
            </div>

            {/* Month grid */}
            <div className='grid grid-cols-7 gap-1'>
              {weekDays.map((wd) => (
                <div
                  key={wd}
                  className='py-2 text-center text-xs font-medium text-muted-foreground'
                >
                  {wd}
                </div>
              ))}
              {days.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} />
                }

                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const dayEntries = entryMap.get(dateStr) ?? []

                const allAvailable =
                  dayEntries.length > 0 && dayEntries.every((e) => e.available)
                const someBooked = dayEntries.some((e) => !e.available)
                const hasData = dayEntries.length > 0

                const avgPrice =
                  dayEntries.filter((e) => e.price != null).reduce((s, e) => s + (e.price ?? 0), 0) /
                  (dayEntries.filter((e) => e.price != null).length || 1)

                const isToday =
                  dateStr ===
                  new Date().toISOString().split('T')[0]

                return (
                  <TooltipProvider key={dateStr}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'relative flex flex-col items-center justify-center rounded-md border p-1.5 text-center transition-colors min-h-[60px]',
                            isToday && 'ring-2 ring-primary',
                            !hasData && 'bg-muted/30',
                            allAvailable &&
                              'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900',
                            someBooked &&
                              'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900'
                          )}
                        >
                          <span
                            className={cn(
                              'text-sm font-medium',
                              isToday && 'text-primary'
                            )}
                          >
                            {day}
                          </span>
                          {hasData && avgPrice > 0 && (
                            <span className='text-[10px] text-muted-foreground'>
                              {formatCurrency(avgPrice, currency)}
                            </span>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side='top' className='max-w-xs'>
                        <p className='font-medium'>
                          {new Date(dateStr + 'T12:00:00').toLocaleDateString(
                            'en-US',
                            {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                            }
                          )}
                        </p>
                        {dayEntries.length === 0 ? (
                          <p className='text-xs text-muted-foreground'>
                            No data
                          </p>
                        ) : (
                          <div className='mt-1 space-y-1'>
                            {dayEntries.map((e) => (
                              <div
                                key={e.id}
                                className='text-xs'
                              >
                                <span className='font-medium capitalize'>
                                  {e.listing.channelName || e.listing.channel}
                                </span>
                                {' — '}
                                {e.available ? 'Available' : 'Booked'}
                                {e.price != null && ` · ${formatCurrency(e.price, currency)}`}
                                {e.minStay != null && ` · min ${e.minStay}n`}
                              </div>
                            ))}
                          </div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ---- Main Component ----

export function PropertyDetail({ propertyId }: { propertyId: string }) {
  const { data: property, isLoading } = useProperty(propertyId)
  const [resPage, setResPage] = useState(1)
  const [revPage, setRevPage] = useState(1)

  const { data: resData } = usePropertyReservations(propertyId, {
    page: resPage,
    perPage: 10,
  })
  const { data: revData } = usePropertyReviews(propertyId, {
    page: revPage,
    perPage: 10,
  })

  // Calendar: current month + next 2 months
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0]
  const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0)
    .toISOString()
    .split('T')[0]
  const { data: calendarEntries } = usePropertyCalendar(
    propertyId,
    startDate,
    endDate
  )

  if (isLoading) {
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
          <div className='flex items-center justify-center py-20'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        </Main>
      </>
    )
  }

  if (!property) {
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
          <div className='flex flex-col items-center justify-center py-20'>
            <Building2 className='h-12 w-12 text-muted-foreground' />
            <h2 className='mt-4 text-lg font-semibold'>Property not found</h2>
            <Button variant='outline' className='mt-4' asChild>
              <Link to='/properties'>Back to Properties</Link>
            </Button>
          </div>
        </Main>
      </>
    )
  }

  const reservations = resData?.data ?? []
  const resMeta = resData?.meta
  const reviews = revData?.data ?? []
  const revMeta = revData?.meta

  // Compute quick stats
  const totalRevenue = reservations.reduce(
    (sum, r) => sum + (r.totalPrice ?? 0),
    0
  )
  const avgNightlyRate =
    reservations.length > 0
      ? totalRevenue /
        reservations.reduce(
          (sum, r) => sum + nightsBetween(r.checkIn, r.checkOut),
          0
        )
      : 0
  const avgRating =
    reviews.filter((r) => r.rating != null).length > 0
      ? reviews
          .filter((r) => r.rating != null)
          .reduce((s, r) => s + (r.rating ?? 0), 0) /
        reviews.filter((r) => r.rating != null).length
      : null

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
        {/* Back link */}
        <Button variant='ghost' size='sm' className='mb-4' asChild>
          <Link to='/properties'>
            <ArrowLeft className='mr-1 h-4 w-4' />
            Back to Properties
          </Link>
        </Button>

        {/* Property Header */}
        <div className='flex flex-col gap-4 md:flex-row md:items-start md:gap-6'>
          {property.imageUrl ? (
            <img
              src={property.imageUrl}
              alt={property.name}
              className='h-48 w-full rounded-lg object-cover md:w-72 flex-shrink-0'
            />
          ) : (
            <div className='flex h-48 w-full items-center justify-center rounded-lg bg-muted md:w-72 flex-shrink-0'>
              <Building2 className='h-16 w-16 text-muted-foreground/50' />
            </div>
          )}
          <div className='flex-1 min-w-0'>
            <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
              {property.name}
            </h1>
            {property.address && (
              <p className='mt-1 flex items-center gap-1 text-muted-foreground'>
                <MapPin className='h-4 w-4 flex-shrink-0' />
                {property.address}
              </p>
            )}
            <div className='mt-3 flex flex-wrap gap-1.5'>
              {property.listings.map((listing) => (
                <Badge
                  key={listing.id}
                  variant='secondary'
                  className={channelColors[listing.channel] ?? ''}
                >
                  {listing.channelName || listing.channel}
                  {listing.listingUrl && (
                    <a
                      href={listing.listingUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='ml-1 hover:opacity-80'
                    >
                      <ExternalLink className='inline h-3 w-3' />
                    </a>
                  )}
                  {!listing.isActive && (
                    <span className='ml-1 opacity-60'>(inactive)</span>
                  )}
                </Badge>
              ))}
              {property.listings.length === 0 && (
                <span className='text-sm text-muted-foreground'>
                  No listings
                </span>
              )}
            </div>
            <div className='mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground'>
              <span className='flex items-center gap-1'>
                <DollarSign className='h-3.5 w-3.5' />
                {property.currency}
              </span>
              <span className='flex items-center gap-1'>
                <Clock className='h-3.5 w-3.5' />
                {property.timezone}
              </span>
              <span className='flex items-center gap-1'>
                <CalendarDays className='h-3.5 w-3.5' />
                {property._count.reservations} reservations
              </span>
              <span className='flex items-center gap-1'>
                <Star className='h-3.5 w-3.5' />
                {property._count.reviews} reviews
              </span>
            </div>
            {property.roomTypes.length > 0 && (
              <div className='mt-3 flex flex-wrap items-center gap-1'>
                <Bed className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm font-medium mr-1'>Room Types:</span>
                {property.roomTypes.map((rt) => (
                  <Badge key={rt.id} variant='outline'>
                    {rt.name}
                    {rt.maxGuests != null && (
                      <span className='ml-1 text-muted-foreground'>
                        <Users className='inline h-3 w-3 mr-0.5' />
                        {rt.maxGuests}
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className='mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <StatCard
            title='Total Reservations'
            value={property._count.reservations}
            subtitle={`${reservations.filter((r) => r.status === 'confirmed').length} confirmed on this page`}
            icon={CalendarDays}
          />
          <StatCard
            title='Page Revenue'
            value={formatCurrency(totalRevenue, property.currency)}
            subtitle={`From ${reservations.length} reservations shown`}
            icon={DollarSign}
          />
          <StatCard
            title='Avg Nightly Rate'
            value={
              avgNightlyRate > 0
                ? formatCurrency(avgNightlyRate, property.currency)
                : '—'
            }
            subtitle='Across loaded reservations'
            icon={TrendingUp}
          />
          <StatCard
            title='Avg Rating'
            value={avgRating != null ? avgRating.toFixed(1) : '—'}
            subtitle={`${property._count.reviews} total reviews`}
            icon={Star}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue='reservations' className='mt-6'>
          <TabsList>
            <TabsTrigger value='overview'>
              <Building2 className='mr-1 h-4 w-4' />
              Listings
            </TabsTrigger>
            <TabsTrigger value='reservations'>
              <CalendarDays className='mr-1 h-4 w-4' />
              Reservations
            </TabsTrigger>
            <TabsTrigger value='reviews'>
              <Star className='mr-1 h-4 w-4' />
              Reviews
            </TabsTrigger>
            <TabsTrigger value='calendar'>
              <Clock className='mr-1 h-4 w-4' />
              Calendar
            </TabsTrigger>
            <TabsTrigger value='concierge'>
              <Building2 className='mr-1 h-4 w-4' />
              Concierge
            </TabsTrigger>
          </TabsList>

          {/* Listings Tab */}
          <TabsContent value='overview'>
            <ListingsSection
              listings={property.listings}
              currency={property.currency}
            />
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value='reservations'>
            <ReservationsTable
              reservations={reservations}
              meta={resMeta}
              page={resPage}
              setPage={setResPage}
              currency={property.currency}
            />
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value='reviews'>
            <ReviewsList
              reviews={reviews}
              meta={revMeta}
              page={revPage}
              setPage={setRevPage}
            />
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value='calendar'>
            <CalendarGrid
              entries={calendarEntries ?? []}
              currency={property.currency}
            />
          </TabsContent>

          {/* Concierge Tab */}
          <TabsContent value='concierge'>
            <ConciergeTab propertyId={propertyId} />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
