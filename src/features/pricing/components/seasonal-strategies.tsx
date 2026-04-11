import {
  CalendarCheck,
  Loader2,
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
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Link } from '@tanstack/react-router'
import { useSeasonalStrategies } from '../api'

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function SeasonalStrategies() {
  const { data: strategies, isLoading } = useSeasonalStrategies()

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
            Seasonal Strategies
          </h1>
          <p className='text-muted-foreground'>
            Set seasonal pricing adjustments and strategies.
          </p>
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center py-20'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : !strategies || strategies.length === 0 ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-16'>
              <CalendarCheck className='h-16 w-16 text-muted-foreground/50' />
              <h2 className='mt-4 text-xl font-semibold'>No seasonal strategies yet</h2>
              <p className='mt-2 max-w-md text-center text-sm text-muted-foreground'>
                Create seasonal pricing strategies to automatically adjust prices based
                on time of year, holidays, and events.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {strategies.map((strategy) => {
              const seasons = Array.isArray(strategy.seasons) ? strategy.seasons : []
              const propCount = Array.isArray(strategy.propertyIds) ? strategy.propertyIds.length : 0

              return (
                <Card key={strategy.id}>
                  <CardHeader>
                    <CardTitle className='text-base'>{strategy.name}</CardTitle>
                    <CardDescription>
                      {propCount} propert{propCount === 1 ? 'y' : 'ies'} · {seasons.length} season{seasons.length === 1 ? '' : 's'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {strategy.notes && (
                      <p className='mb-3 text-sm text-muted-foreground'>{strategy.notes}</p>
                    )}
                    <div className='flex flex-wrap gap-1'>
                      {seasons.slice(0, 4).map((season: { name?: string }, idx: number) => (
                        <Badge key={idx} variant='outline'>
                          {(season as { name?: string }).name ?? `Season ${idx + 1}`}
                        </Badge>
                      ))}
                      {seasons.length > 4 && (
                        <Badge variant='secondary'>+{seasons.length - 4} more</Badge>
                      )}
                    </div>
                    <p className='mt-3 text-xs text-muted-foreground'>
                      Created {formatDate(strategy.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </Main>
    </>
  )
}
