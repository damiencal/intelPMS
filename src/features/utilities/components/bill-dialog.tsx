import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
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
import { Textarea } from '@/components/ui/textarea'
import { type UtilityBill, UTILITY_TYPES, BILL_STATUSES } from '../api'

const schema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  utilityType: z.string().min(1, 'Utility type is required'),
  provider: z.string().optional(),
  accountNumber: z.string().optional(),
  billingPeriodStart: z.string().min(1, 'Start date is required'),
  billingPeriodEnd: z.string().min(1, 'End date is required'),
  amount: z.coerce.number().positive('Amount must be > 0'),
  currency: z.string().default('USD'),
  usage: z.coerce.number().min(0).optional().or(z.literal('')),
  usageUnit: z.string().optional(),
  dueDate: z.string().optional(),
  paidDate: z.string().optional(),
  status: z.string().min(1),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: Record<string, unknown>) => void
  isLoading?: boolean
  defaultValues?: UtilityBill | null
}

export function BillDialog({ open, onOpenChange, onSubmit, isLoading, defaultValues }: Props) {
  const isEdit = !!defaultValues

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      propertyId: '',
      utilityType: 'electric',
      provider: '',
      accountNumber: '',
      billingPeriodStart: '',
      billingPeriodEnd: '',
      amount: '' as any,
      currency: 'USD',
      usage: '' as any,
      usageUnit: '',
      dueDate: '',
      paidDate: '',
      status: 'pending',
      notes: '',
    },
  })

  const { data: propertiesRes } = useQuery({
    queryKey: ['properties', 'all'],
    queryFn: () => api.get('/api/properties?per_page=100').then((r) => r.json()),
  })
  const properties = propertiesRes?.data ?? []

  useEffect(() => {
    if (open && defaultValues) {
      form.reset({
        propertyId: defaultValues.propertyId,
        utilityType: defaultValues.utilityType,
        provider: defaultValues.provider || '',
        accountNumber: defaultValues.accountNumber || '',
        billingPeriodStart: defaultValues.billingPeriodStart.split('T')[0],
        billingPeriodEnd: defaultValues.billingPeriodEnd.split('T')[0],
        amount: defaultValues.amount,
        currency: defaultValues.currency,
        usage: defaultValues.usage ?? ('' as any),
        usageUnit: defaultValues.usageUnit || '',
        dueDate: defaultValues.dueDate?.split('T')[0] || '',
        paidDate: defaultValues.paidDate?.split('T')[0] || '',
        status: defaultValues.status,
        notes: defaultValues.notes || '',
      })
    } else if (!open) {
      form.reset()
    }
  }, [open, defaultValues, form])

  const handleSubmit = (values: FormValues) => {
    onSubmit({
      ...(isEdit ? { id: defaultValues.id } : {}),
      ...values,
      provider: values.provider || null,
      accountNumber: values.accountNumber || null,
      usage: values.usage || null,
      usageUnit: values.usageUnit || null,
      dueDate: values.dueDate || null,
      paidDate: values.paidDate || null,
      notes: values.notes || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[550px]'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Bill' : 'Add Utility Bill'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update bill details.' : 'Record a utility bill for a property.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='propertyId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select property' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='utilityType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Utility Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UTILITY_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.icon} {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='provider'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <FormControl>
                      <Input placeholder='Utility company' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='accountNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account #</FormLabel>
                    <FormControl>
                      <Input placeholder='Account number' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='billingPeriodStart'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period Start</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='billingPeriodEnd'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period End</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-3 gap-4'>
              <FormField
                control={form.control}
                name='amount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input type='number' step='0.01' placeholder='0.00' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='usage'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage</FormLabel>
                    <FormControl>
                      <Input type='number' step='0.01' placeholder='0' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='usageUnit'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder='kWh, gal...' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-3 gap-4'>
              <FormField
                control={form.control}
                name='dueDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='paidDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paid Date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BILL_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder='Optional notes...' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {isEdit ? 'Update' : 'Add Bill'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
