import { Loader2, CalendarClock } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { useTeamMembers } from './api'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider } from './components/users-provider'
import { UsersTable } from './components/users-table'

export function Users() {
  const { data: members, isLoading } = useTeamMembers()

  return (
    <UsersProvider>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Team Members</h2>
            <p className='text-muted-foreground'>
              Manage your team members and their roles.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Link to='/team-shifts'>
              <Button variant='ghost' size='icon' className='h-8 w-8' title='Team Scheduling'>
                <CalendarClock size={16} />
              </Button>
            </Link>
            <UsersPrimaryButtons />
          </div>
        </div>
        {isLoading ? (
          <div className='flex flex-1 items-center justify-center'>
            <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
          </div>
        ) : (
          <UsersTable data={(members ?? []) as any} />
        )}
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}
