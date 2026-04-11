import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
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
  type StaffPayroll,
  PAYROLL_ROLES,
  PAY_TYPES,
  PAYROLL_STATUS,
} from '../api'

const schema = z.object({
  staffName: z.string().min(1, 'Staff name is required'),
  staffEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  role: z.string().min(1),
  payType: z.string().min(1),
  payRate: z.coerce.number().positive('Pay rate must be > 0'),
  currency: z.string().default('USD'),
  hoursWorked: z.coerce.number().min(0).optional().or(z.literal('')),
  tasksCompleted: z.coerce.number().min(0).optional().or(z.literal('')),
  grossAmount: z.coerce.number().min(0).optional().or(z.literal('')),
  deductions: z.coerce.number().min(0).default(0),
  periodStart: z.string().min(1, 'Period start is required'),
  periodEnd: z.string().min(1, 'Period end is required'),
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
  defaultValues?: StaffPayroll | null
}

export function PayrollDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  defaultValues,
}: Props) {
  const isEdit = !!defaultValues

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      staffName: '',
      staffEmail: '',
      role: 'cleaner',
      payType: 'hourly',
      payRate: '' as never,
      currency: 'USD',
      hoursWorked: '' as never,
      tasksCompleted: '' as never,
      grossAmount: '' as never,
      deductions: 0,
      periodStart: '',
      periodEnd: '',
      paidDate: '',
      status: 'pending',
      notes: '',
    },
  })

  useEffect(() => {
    if (open && defaultValues) {
      form.reset({
        staffName: defaultValues.staffName,
        staffEmail: defaultValues.staffEmail || '',
        role: defaultValues.role,
        payType: defaultValues.payType,
        payRate: defaultValues.payRate,
        currency: defaultValues.currency,
        hoursWorked: (defaultValues.hoursWorked ?? '') as never,
        tasksCompleted: (defaultValues.tasksCompleted ?? '') as never,
        grossAmount: defaultValues.grossAmount as never,
        deductions: defaultValues.deductions,
        periodStart: defaultValues.periodStart.split('T')[0],
        periodEnd: defaultValues.periodEnd.split('T')[0],
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
      staffEmail: values.staffEmail || null,
      hoursWorked: values.hoursWorked || null,
      tasksCompleted: values.tasksCompleted || null,
      grossAmount: values.grossAmount || null,
      paidDate: values.paidDate || null,
      notes: values.notes || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[580px]'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Payroll' : 'Add Payroll Entry'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update payroll details.' : 'Create a payroll entry for staff.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='staffName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Staff Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Jane Doe' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='staffEmail'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Staff Email</FormLabel>
                    <FormControl>
                      <Input placeholder='jane@example.com' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYROLL_ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
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
                name='payType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pay Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAY_TYPES.map((t) => (
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
            </div>

            <div className='grid grid-cols-3 gap-4'>
              <FormField
                control={form.control}
                name='payRate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pay Rate</FormLabel>
                    <FormControl>
                      <Input type='number' step='0.01' min='0' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='hoursWorked'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours</FormLabel>
                    <FormControl>
                      <Input type='number' step='0.1' min='0' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='tasksCompleted'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tasks</FormLabel>
                    <FormControl>
                      <Input type='number' min='0' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='grossAmount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gross Amount (optional)</FormLabel>
                    <FormControl>
                      <Input type='number' step='0.01' min='0' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='deductions'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deductions</FormLabel>
                    <FormControl>
                      <Input type='number' step='0.01' min='0' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='periodStart'
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
                name='periodEnd'
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

            <div className='grid grid-cols-2 gap-4'>
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
                        {PAYROLL_STATUS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
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
            </div>

            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder='Optional notes' {...field} />
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
                {isEdit ? 'Save Changes' : 'Create Entry'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
