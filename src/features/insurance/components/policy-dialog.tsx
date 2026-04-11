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
import {
  type InsurancePolicy,
  POLICY_TYPES,
  POLICY_STATUSES,
  PREMIUM_FREQUENCIES,
} from '../api'

const schema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  policyNumber: z.string().min(1, 'Policy number is required'),
  provider: z.string().min(1, 'Provider is required'),
  type: z.string().min(1, 'Type is required'),
  coverageAmount: z.coerce.number().positive('Must be > 0'),
  premiumAmount: z.coerce.number().positive('Must be > 0'),
  premiumFrequency: z.string().min(1, 'Frequency is required'),
  deductible: z.coerce.number().min(0).optional().or(z.literal('')),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z.string().min(1),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: Record<string, unknown>) => void
  isLoading?: boolean
  defaultValues?: InsurancePolicy | null
}

export function PolicyDialog({ open, onOpenChange, onSubmit, isLoading, defaultValues }: Props) {
  const isEdit = !!defaultValues

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      propertyId: '',
      policyNumber: '',
      provider: '',
      type: 'property',
      coverageAmount: '' as any,
      premiumAmount: '' as any,
      premiumFrequency: 'annually',
      deductible: '' as any,
      startDate: '',
      endDate: '',
      status: 'active',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
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
        policyNumber: defaultValues.policyNumber,
        provider: defaultValues.provider,
        type: defaultValues.type,
        coverageAmount: defaultValues.coverageAmount,
        premiumAmount: defaultValues.premiumAmount,
        premiumFrequency: defaultValues.premiumFrequency,
        deductible: defaultValues.deductible ?? ('' as any),
        startDate: defaultValues.startDate.split('T')[0],
        endDate: defaultValues.endDate.split('T')[0],
        status: defaultValues.status,
        contactName: defaultValues.contactName || '',
        contactPhone: defaultValues.contactPhone || '',
        contactEmail: defaultValues.contactEmail || '',
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
      deductible: values.deductible || null,
      contactName: values.contactName || null,
      contactPhone: values.contactPhone || null,
      contactEmail: values.contactEmail || null,
      notes: values.notes || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Policy' : 'Add Insurance Policy'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update policy details.' : 'Add a new insurance policy for a property.'}
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
                name='policyNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy Number</FormLabel>
                    <FormControl>
                      <Input placeholder='POL-12345' {...field} />
                    </FormControl>
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
                      <Input placeholder='Insurance Co.' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {POLICY_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-3 gap-4'>
              <FormField
                control={form.control}
                name='coverageAmount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coverage ($)</FormLabel>
                    <FormControl>
                      <Input type='number' step='0.01' placeholder='0.00' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='premiumAmount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Premium ($)</FormLabel>
                    <FormControl>
                      <Input type='number' step='0.01' placeholder='0.00' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='premiumFrequency'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PREMIUM_FREQUENCIES.map((f) => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-3 gap-4'>
              <FormField
                control={form.control}
                name='deductible'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deductible ($)</FormLabel>
                    <FormControl>
                      <Input type='number' step='0.01' placeholder='0.00' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='startDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='endDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className='w-48'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {POLICY_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-3 gap-4'>
              <FormField
                control={form.control}
                name='contactName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Agent name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='contactPhone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder='+1...' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='contactEmail'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input type='email' placeholder='agent@ins.com' {...field} />
                    </FormControl>
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
                {isEdit ? 'Update' : 'Add Policy'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
