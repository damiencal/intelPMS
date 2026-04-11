import { useState } from 'react'
import { Loader2, Plus, Scale, Crosshair } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import type { PricingRule } from './api'
import { usePricingRules } from './api'
import { RulesTable } from './components/rules-table'
import { RuleDialog } from './components/rule-dialog'

export { PricingProposals } from './components/proposals'
export { SeasonalStrategies } from './components/seasonal-strategies'

export function PricingRules() {
  const { data: rules, isLoading } = usePricingRules()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null)

  function handleCreate() {
    setEditingRule(null)
    setDialogOpen(true)
  }

  function handleEdit(rule: PricingRule) {
    setEditingRule(rule)
    setDialogOpen(true)
  }

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

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
              Pricing Rules
            </h1>
            <p className='text-muted-foreground'>
              Configure dynamic pricing rules for your listings.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <div className='flex items-center gap-1'>
              <Link to='/rate-parity'>
                <Button variant='ghost' size='icon' className='h-8 w-8' title='Rate Parity'>
                  <Scale size={16} />
                </Button>
              </Link>
              <Link to='/competitor-rates'>
                <Button variant='ghost' size='icon' className='h-8 w-8' title='Competitor Rates'>
                  <Crosshair size={16} />
                </Button>
              </Link>
            </div>
            {rules && rules.length > 0 && (
              <Button onClick={handleCreate}>
                <Plus className='mr-2 h-4 w-4' />
                Create Rule
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center py-16'>
            <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
          </div>
        ) : (
          <RulesTable
            rules={rules ?? []}
            onEdit={handleEdit}
            onCreate={handleCreate}
          />
        )}
      </Main>

      <RuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rule={editingRule}
      />
    </>
  )
}
