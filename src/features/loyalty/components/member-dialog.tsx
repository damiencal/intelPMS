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
import { type LoyaltyMember, LOYALTY_TIERS, MEMBER_STATUSES } from '../api'

const schema = z.object({
  guestName: z.string().min(1, 'Name is required'),
  guestEmail: z.string().email('Invalid email'),
  phone: z.string().optional(),
  tier: z.string().min(1, 'Tier is required'),
  totalStays: z.coerce.number().int().min(0).default(0),
  totalSpent: z.coerce.number().min(0).default(0),
  pointsBalance: z.coerce.number().int().min(0).default(0),
  pointsEarned: z.coerce.number().int().min(0).default(0),
  pointsRedeemed: z.coerce.number().int().min(0).default(0),
  lastStayDate: z.string().optional(),
  status: z.string().min(1),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: Record<string, unknown>) => void
  isLoading?: boolean
  defaultValues?: LoyaltyMember | null
}

export function MemberDialog({ open, onOpenChange, onSubmit, isLoading, defaultValues }: Props) {
  const isEdit = !!defaultValues

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      guestName: '',
      guestEmail: '',
      phone: '',
      tier: 'bronze',
      totalStays: 0,
      totalSpent: 0,
      pointsBalance: 0,
      pointsEarned: 0,
      pointsRedeemed: 0,
      lastStayDate: '',
      status: 'active',
      notes: '',
    },
  })

  useEffect(() => {
    if (open && defaultValues) {
      form.reset({
        guestName: defaultValues.guestName,
        guestEmail: defaultValues.guestEmail,
        phone: defaultValues.phone || '',
        tier: defaultValues.tier,
        totalStays: defaultValues.totalStays,
        totalSpent: defaultValues.totalSpent,
        pointsBalance: defaultValues.pointsBalance,
        pointsEarned: defaultValues.pointsEarned,
        pointsRedeemed: defaultValues.pointsRedeemed,
        lastStayDate: defaultValues.lastStayDate?.split('T')[0] || '',
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
      lastStayDate: values.lastStayDate || null,
      phone: values.phone || null,
      notes: values.notes || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[550px]'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Member' : 'Add Loyalty Member'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update member details.' : 'Enroll a guest in the loyalty program.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='guestName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guest Name</FormLabel>
                    <FormControl>
                      <Input placeholder='John Doe' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='guestEmail'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type='email' placeholder='john@example.com' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-3 gap-4'>
              <FormField
                control={form.control}
                name='phone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder='+1...' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='tier'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tier</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LOYALTY_TIERS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        {MEMBER_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
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
                name='totalStays'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Stays</FormLabel>
                    <FormControl>
                      <Input type='number' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='totalSpent'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Spent ($)</FormLabel>
                    <FormControl>
                      <Input type='number' step='0.01' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='lastStayDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Stay</FormLabel>
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
                name='pointsBalance'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points Balance</FormLabel>
                    <FormControl>
                      <Input type='number' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='pointsEarned'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Earned</FormLabel>
                    <FormControl>
                      <Input type='number' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='pointsRedeemed'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Redeemed</FormLabel>
                    <FormControl>
                      <Input type='number' {...field} />
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
                {isEdit ? 'Update' : 'Enroll Member'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
