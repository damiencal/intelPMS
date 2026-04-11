import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

const inputClass =
  'w-full border border-black/[0.08] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/[0.15] focus:border-transparent placeholder:text-gray-400/60 bg-white'
const labelClass = 'block text-[13px] font-medium text-gray-700 mb-1.5'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: Record<string, unknown>) => void
  isLoading?: boolean
  defaultValues?: StaffPayroll | null
}

export function PayrollDialog({ open, onOpenChange, onSubmit, isLoading, defaultValues }: Props) {
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
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[580px] bg-white rounded-2xl shadow-xl p-0 border-0 animate-scale-in'>
        {/* Header */}
        <DialogHeader className='flex flex-row items-center justify-between px-6 pt-6 pb-0'>
          <DialogTitle className='text-lg font-semibold text-gray-900'>
            {isEdit ? 'Edit Payroll Entry' : 'Add Payroll Entry'}
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className='p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-black/[0.15]'
            aria-label='Close dialog'
          >
            <X className='h-4 w-4' />
          </button>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='px-6 pb-6 pt-5 space-y-4'>
            {/* Staff info */}
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='staffName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Staff Name</FormLabel>
                    <FormControl>
                      <input className={inputClass} placeholder='Jane Doe' {...field} />
                    </FormControl>
                    <FormMessage className='text-xs text-red-500 mt-1' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='staffEmail'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Staff Email</FormLabel>
                    <FormControl>
                      <input className={inputClass} placeholder='jane@example.com' {...field} />
                    </FormControl>
                    <FormMessage className='text-xs text-red-500 mt-1' />
                  </FormItem>
                )}
              />
            </div>

            {/* Role & Pay Type */}
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className='border-black/[0.08] rounded-xl text-sm focus:ring-2 focus:ring-black/[0.15]'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYROLL_ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className='text-xs text-red-500 mt-1' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='payType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Pay Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className='border-black/[0.08] rounded-xl text-sm focus:ring-2 focus:ring-black/[0.15]'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAY_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className='text-xs text-red-500 mt-1' />
                  </FormItem>
                )}
              />
            </div>

            {/* Rate, Hours, Tasks */}
            <div className='grid grid-cols-3 gap-4'>
              <FormField
                control={form.control}
                name='payRate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Pay Rate</FormLabel>
                    <FormControl>
                      <input className={inputClass} type='number' step='0.01' min='0' {...field} />
                    </FormControl>
                    <FormMessage className='text-xs text-red-500 mt-1' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='hoursWorked'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Hours</FormLabel>
                    <FormControl>
                      <input className={inputClass} type='number' step='0.1' min='0' {...field} />
                    </FormControl>
                    <FormMessage className='text-xs text-red-500 mt-1' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='tasksCompleted'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Tasks</FormLabel>
                    <FormControl>
                      <input className={inputClass} type='number' min='0' {...field} />
                    </FormControl>
                    <FormMessage className='text-xs text-red-500 mt-1' />
                  </FormItem>
                )}
              />
            </div>

            {/* Gross & Deductions */}
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='grossAmount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Gross Amount <span className='text-gray-400 font-normal'>(optional)</span></FormLabel>
                    <FormControl>
                      <input className={inputClass} type='number' step='0.01' min='0' {...field} />
                    </FormControl>
                    <FormMessage className='text-xs text-red-500 mt-1' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='deductions'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Deductions</FormLabel>
                    <FormControl>
                      <input className={inputClass} type='number' step='0.01' min='0' {...field} />
                    </FormControl>
                    <FormMessage className='text-xs text-red-500 mt-1' />
                  </FormItem>
                )}
              />
            </div>

            {/* Period */}
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='periodStart'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Period Start</FormLabel>
                    <FormControl>
                      <input className={inputClass} type='date' {...field} />
                    </FormControl>
                    <FormMessage className='text-xs text-red-500 mt-1' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='periodEnd'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Period End</FormLabel>
                    <FormControl>
                      <input className={inputClass} type='date' {...field} />
                    </FormControl>
                    <FormMessage className='text-xs text-red-500 mt-1' />
                  </FormItem>
                )}
              />
            </div>

            {/* Status & Paid Date */}
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className='border-black/[0.08] rounded-xl text-sm focus:ring-2 focus:ring-black/[0.15]'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYROLL_STATUS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className='text-xs text-red-500 mt-1' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='paidDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Paid Date</FormLabel>
                    <FormControl>
                      <input className={inputClass} type='date' {...field} />
                    </FormControl>
                    <FormMessage className='text-xs text-red-500 mt-1' />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Notes</FormLabel>
                  <FormControl>
                    <textarea
                      className={`${inputClass} resize-none max-h-32`}
                      rows={3}
                      placeholder='Optional notes'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className='text-xs text-red-500 mt-1' />
                </FormItem>
              )}
            />

            {/* Footer */}
            <div className='flex items-center justify-end gap-2 pt-5 border-t border-black/[0.05]'>
              <button
                type='button'
                onClick={() => onOpenChange(false)}
                className='px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-black/[0.15]'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={isLoading}
                className='px-4 py-2 bg-gray-900 hover:bg-gray-900/90 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-black/[0.15]'
              >
                {isLoading && <Loader2 className='h-4 w-4 animate-spin' />}
                {isEdit ? 'Save Changes' : 'Create Entry'}
              </button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}


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
