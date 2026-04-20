import { useState } from 'react'
import {
  Building2,
  MapPin,
  Star,
  CalendarDays,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useProperties } from '../api'
import type { Property } from '../api'

const channelColors: Record<string, string> = {
  airbnb: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  booking: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  vrbo: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  direct: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
}

function PropertyCard({ property }: { property: Property }) {
  return (
    <Card className='overflow-hidden transition-shadow hover:shadow-md'>
      <div className='flex flex-col sm:flex-row'>
        {/* Image / Placeholder */}
        <div className='relative h-40 w-full sm:h-auto sm:w-48 flex-shrink-0 bg-muted'>
          {property.imageUrl ? (
            <img
              src={property.imageUrl}
              alt={property.name}
              className='h-full w-full object-cover'
            />
          ) : (
            <div className='flex h-full items-center justify-center'>
              <Building2 className='h-12 w-12 text-muted-foreground/50' />
            </div>
          )}
        </div>

        {/* Content */}
        <div className='flex-1 p-4'>
          <div className='flex items-start justify-between gap-2'>
            <div>
              <Link
                to='/properties/$propertyId'
                params={{ propertyId: property.id }}
                className='text-lg font-semibold hover:underline'
              >
                {property.name}
              </Link>
              {property.address && (
                <p className='mt-1 flex items-center gap-1 text-sm text-muted-foreground'>
                  <MapPin className='h-3.5 w-3.5' />
                  {property.address}
                </p>
              )}
            </div>
          </div>

          {/* Channel Badges */}
          <div className='mt-3 flex flex-wrap gap-1.5'>
            {property.listings.map((listing) => (
              <Badge
                key={listing.id}
                variant='secondary'
                className={channelColors[listing.channel] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}
              >
                {listing.channelName || listing.channel}
                {!listing.isActive && ' (inactive)'}
              </Badge>
            ))}
            {property.listings.length === 0 && (
              <span className='text-sm text-muted-foreground'>No listings</span>
            )}
          </div>

          {/* Stats */}
          <div className='mt-3 flex items-center gap-4 text-sm text-muted-foreground'>
            <span className='flex items-center gap-1'>
              <CalendarDays className='h-3.5 w-3.5' />
              {property._count.reservations} reservations
            </span>
            <span className='flex items-center gap-1'>
              <Star className='h-3.5 w-3.5' />
              {property._count.reviews} reviews
            </span>
            <span className='text-xs'>
              {property.currency} · {property.timezone}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export function Properties() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useProperties({ page, perPage: 12 })

  const properties = data?.data ?? []
  const meta = data?.meta

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
        <div className='mb-4 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
              Properties
            </h1>
            <p className='text-muted-foreground'>
              Manage your short-term rental properties and listings.
            </p>
          </div>
          <Button variant='outline' asChild>
            <Link to='/settings/connections'>
              <ExternalLink className='mr-2 h-4 w-4' />
              Connections
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center py-20'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : properties.length === 0 ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-16'>
              <Building2 className='h-16 w-16 text-muted-foreground/50' />
              <h2 className='mt-4 text-xl font-semibold'>No properties yet</h2>
              <p className='mt-2 max-w-md text-center text-sm text-muted-foreground'>
                Connect your Hostex account to start syncing properties.
                Head to Settings &rarr; Connections to get started.
              </p>
              <Button className='mt-6' variant='outline' asChild>
                <Link to='/settings/connections'>Go to Connections</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className='grid gap-4'>
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className='mt-6 flex items-center justify-between'>
                <p className='text-sm text-muted-foreground'>
                  Showing {(meta.page - 1) * meta.perPage + 1}–
                  {Math.min(meta.page * meta.perPage, meta.total)} of {meta.total} properties
                </p>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className='h-4 w-4' />
                    Previous
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={page >= meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Main>
    </>
  )
}
