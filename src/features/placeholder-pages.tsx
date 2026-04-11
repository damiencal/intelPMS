import {
  Building2,
  CalendarCheck,
  Star,
  BarChart3,
  DollarSign,
  FileText,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
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

interface PlaceholderPageProps {
  title: string
  description: string
  icon: React.ElementType
  children?: React.ReactNode
}

export function PlaceholderPage({
  title,
  description,
  icon: Icon,
  children,
}: PlaceholderPageProps) {
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
              {title}
            </h1>
            <p className='text-muted-foreground'>{description}</p>
          </div>
        </div>
        {children ?? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-16'>
              <Icon className='h-16 w-16 text-muted-foreground/50' />
              <h2 className='mt-4 text-xl font-semibold'>
                No data yet
              </h2>
              <p className='mt-2 max-w-md text-center text-sm text-muted-foreground'>
                Connect your Hostex account to start syncing {title.toLowerCase()} data.
                Head to Settings &rarr; Connections to get started.
              </p>
              <Button className='mt-6' variant='outline' asChild>
                <Link to='/settings/connections'>Go to Connections</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </Main>
    </>
  )
}

export function PropertiesPage() {
  return (
    <PlaceholderPage
      title='Properties'
      description='Manage your short-term rental properties and listings.'
      icon={Building2}
    />
  )
}

export function PricingRulesPage() {
  return (
    <PlaceholderPage
      title='Pricing Rules'
      description='Configure dynamic pricing rules for your listings.'
      icon={DollarSign}
    />
  )
}

export function PricingSeasonalPage() {
  return (
    <PlaceholderPage
      title='Seasonal Strategies'
      description='Set seasonal pricing adjustments and strategies.'
      icon={CalendarCheck}
    />
  )
}

export function PricingProposalsPage() {
  return (
    <PlaceholderPage
      title='Pricing Proposals'
      description='Review and approve AI-generated pricing proposals.'
      icon={FileText}
    />
  )
}

export function ReviewsPage() {
  return (
    <PlaceholderPage
      title='Reviews'
      description='Manage guest reviews and response workflows.'
      icon={Star}
    />
  )
}

export function AnalyticsPage() {
  return (
    <PlaceholderPage
      title='Analytics'
      description='Revenue, occupancy, and performance analytics.'
      icon={BarChart3}
    />
  )
}
