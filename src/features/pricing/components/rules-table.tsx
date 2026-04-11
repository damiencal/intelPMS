import { useState } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  GripVertical,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
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
import { ConfirmDialog } from '@/components/confirm-dialog'
import type { PricingRule } from '../api'
import {
  useDeletePricingRule,
  useTogglePricingRule,
} from '../api'
import { RULE_TYPE_MAP } from '../data'

interface RulesTableProps {
  rules: PricingRule[]
  onEdit: (rule: PricingRule) => void
  onCreate: () => void
}

function formatAction(action: Record<string, unknown>): string {
  const type = action.type as string
  const value = action.value as number | undefined

  switch (type) {
    case 'set_price':
      return `Set to $${value}`
    case 'adjust_percent':
      return value && value > 0 ? `+${value}%` : `${value}%`
    case 'adjust_amount':
      return value && value > 0 ? `+$${value}` : `-$${Math.abs(value ?? 0)}`
    case 'multiply':
      return `×${value}`
    default:
      return type ?? '—'
  }
}

function formatAppliesTo(appliesTo: PricingRule['appliesTo']): string {
  if (appliesTo.all) return 'All properties'
  const propCount = appliesTo.property_ids?.length ?? 0
  const listingCount = appliesTo.listing_ids?.length ?? 0
  const parts = []
  if (propCount) parts.push(`${propCount} propert${propCount === 1 ? 'y' : 'ies'}`)
  if (listingCount) parts.push(`${listingCount} listing${listingCount === 1 ? '' : 's'}`)
  return parts.length ? parts.join(', ') : 'None'
}

export function RulesTable({ rules, onEdit, onCreate }: RulesTableProps) {
  const toggleRule = useTogglePricingRule()
  const deleteRule = useDeletePricingRule()
  const [deleteTarget, setDeleteTarget] = useState<PricingRule | null>(null)

  if (rules.length === 0) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-16'>
          <DollarSign className='h-16 w-16 text-muted-foreground/50' />
          <h2 className='mt-4 text-xl font-semibold'>No pricing rules yet</h2>
          <p className='mt-2 max-w-md text-center text-sm text-muted-foreground'>
            Create your first pricing rule to start automating your listing prices.
            Rules are applied in priority order.
          </p>
          <Button className='mt-6' onClick={onCreate}>
            <Plus className='mr-2 h-4 w-4' />
            Create Rule
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-10'></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Applies To</TableHead>
              <TableHead className='text-center'>Enabled</TableHead>
              <TableHead className='w-24'></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>
                  <GripVertical className='h-4 w-4 text-muted-foreground/50' />
                </TableCell>
                <TableCell className='font-medium'>{rule.name}</TableCell>
                <TableCell>
                  <Badge variant='outline'>
                    {RULE_TYPE_MAP[rule.type] ?? rule.type}
                  </Badge>
                </TableCell>
                <TableCell className='font-mono text-sm'>
                  {formatAction(rule.action)}
                </TableCell>
                <TableCell className='text-sm text-muted-foreground'>
                  {formatAppliesTo(rule.appliesTo)}
                </TableCell>
                <TableCell className='text-center'>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className='inline-flex'>
                          <Switch
                            checked={rule.enabled}
                            disabled={toggleRule.isPending}
                            onCheckedChange={(enabled) =>
                              toggleRule.mutate(
                                { id: rule.id, enabled },
                                {
                                  onSuccess: () =>
                                    toast.success(
                                      `Rule "${rule.name}" ${enabled ? 'enabled' : 'disabled'}`
                                    ),
                                  onError: () =>
                                    toast.error('Failed to update rule'),
                                }
                              )
                            }
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {rule.enabled ? 'Disable rule' : 'Enable rule'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-1'>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8'
                      onClick={() => onEdit(rule)}
                    >
                      <Pencil className='h-4 w-4' />
                      <span className='sr-only'>Edit</span>
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 text-destructive hover:text-destructive'
                      onClick={() => setDeleteTarget(rule)}
                    >
                      <Trash2 className='h-4 w-4' />
                      <span className='sr-only'>Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title='Delete Pricing Rule'
        desc={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        destructive
        confirmText='Delete'
        isLoading={deleteRule.isPending}
        handleConfirm={() => {
          if (!deleteTarget) return
          deleteRule.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success('Rule deleted')
              setDeleteTarget(null)
            },
            onError: () => toast.error('Failed to delete rule'),
          })
        }}
      />
    </>
  )
}
