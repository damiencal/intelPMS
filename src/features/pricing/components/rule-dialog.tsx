import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { PricingRule, CreateRulePayload } from '../api'
import { useCreatePricingRule, useUpdatePricingRule } from '../api'
import { RULE_TYPES, ACTION_TYPES } from '../data'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  priority: z.number().int().min(0),
  actionType: z.string().min(1, 'Action type is required'),
  actionValue: z.number(),
  enabled: z.boolean(),
  allProperties: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

interface RuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule?: PricingRule | null
}

export function RuleDialog({ open, onOpenChange, rule }: RuleDialogProps) {
  const isEditing = !!rule
  const createRule = useCreatePricingRule()
  const updateRule = useUpdatePricingRule()
  const isPending = createRule.isPending || updateRule.isPending

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: '',
      priority: 0,
      actionType: 'adjust_percent',
      actionValue: 0,
      enabled: true,
      allProperties: true,
    },
  })

  useEffect(() => {
    if (open && rule) {
      const action = rule.action as { type?: string; value?: number }
      form.reset({
        name: rule.name,
        type: rule.type,
        priority: rule.priority,
        actionType: action.type ?? 'adjust_percent',
        actionValue: action.value ?? 0,
        enabled: rule.enabled,
        allProperties: rule.appliesTo?.all ?? true,
      })
    } else if (open && !rule) {
      form.reset({
        name: '',
        type: '',
        priority: 0,
        actionType: 'adjust_percent',
        actionValue: 0,
        enabled: true,
        allProperties: true,
      })
    }
  }, [open, rule, form])

  function onSubmit(data: FormValues) {
    const payload: CreateRulePayload = {
      name: data.name,
      type: data.type,
      priority: data.priority,
      conditions: [],
      action: { type: data.actionType, value: data.actionValue },
      enabled: data.enabled,
      appliesTo: data.allProperties ? { all: true } : { all: false },
    }

    if (isEditing && rule) {
      updateRule.mutate(
        { id: rule.id, ...payload },
        {
          onSuccess: () => {
            toast.success('Rule updated')
            onOpenChange(false)
          },
          onError: () => toast.error('Failed to update rule'),
        }
      )
    } else {
      createRule.mutate(payload, {
        onSuccess: () => {
          toast.success('Rule created')
          onOpenChange(false)
        },
        onError: () => toast.error('Failed to create rule'),
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Create'} Pricing Rule</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the pricing rule configuration.'
              : 'Set up a new dynamic pricing rule for your listings.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rule Name</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. Weekend Surge' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Select type' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RULE_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='priority'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <Input type='number' min={0} {...field} />
                    </FormControl>
                    <FormDescription>Lower = higher priority</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='actionType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Select action' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACTION_TYPES.map((a) => (
                          <SelectItem key={a.value} value={a.value}>
                            {a.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='actionValue'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        step='any'
                        placeholder='e.g. 15'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {form.watch('actionType') === 'adjust_percent'
                        ? 'Percentage (e.g. 15 for +15%)'
                        : form.watch('actionType') === 'set_price'
                          ? 'Fixed price in currency'
                          : form.watch('actionType') === 'multiply'
                            ? 'Multiplier factor'
                            : 'Amount in currency'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='flex items-center gap-6'>
              <FormField
                control={form.control}
                name='enabled'
                render={({ field }) => (
                  <FormItem className='flex items-center gap-2 space-y-0'>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className='font-normal'>Enabled</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='allProperties'
                render={({ field }) => (
                  <FormItem className='flex items-center gap-2 space-y-0'>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className='font-normal'>
                      Apply to all properties
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isPending}>
                {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {isEditing ? 'Save Changes' : 'Create Rule'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
