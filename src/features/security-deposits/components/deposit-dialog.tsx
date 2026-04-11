import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DEPOSIT_STATUSES, type SecurityDeposit } from '../api'

const schema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  reservationId: z.string().optional(),
  guestName: z.string().min(1, 'Guest name is required'),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().optional(),
  collectedDate: z.string().min(1, 'Collection date is required'),
  status: z.string().optional(),
  refundAmount: z.string().optional(),
  claimAmount: z.string().optional(),
  claimReason: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  item?: SecurityDeposit | null
  properties: { id: string; name: string }[]
  onSubmit: (data: Record<string, unknown>) => void
}

export function DepositDialog({ open, onOpenChange, item, properties, onSubmit }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      propertyId: '',
      reservationId: '',
      guestName: '',
      amount: '',
      currency: 'USD',
      collectedDate: new Date().toISOString().split('T')[0],
      status: 'held',
      refundAmount: '',
      claimAmount: '',
      claimReason: '',
      notes: '',
    },
  })

  const status = form.watch('status')

  useEffect(() => {
    if (item) {
      form.reset({
        propertyId: item.propertyId,
        reservationId: item.reservationId ?? '',
        guestName: item.guestName,
        amount: String(item.amount),
        currency: item.currency,
        collectedDate: item.collectedDate?.split('T')[0] ?? '',
        status: item.status,
        refundAmount: item.refundAmount ? String(item.refundAmount) : '',
        claimAmount: item.claimAmount ? String(item.claimAmount) : '',
        claimReason: item.claimReason ?? '',
        notes: item.notes ?? '',
      })
    } else {
      form.reset({
        propertyId: '',
        reservationId: '',
        guestName: '',
        amount: '',
        currency: 'USD',
        collectedDate: new Date().toISOString().split('T')[0],
        status: 'held',
        refundAmount: '',
        claimAmount: '',
        claimReason: '',
        notes: '',
      })
    }
  }, [item, open])

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit({
      propertyId: data.propertyId,
      reservationId: data.reservationId || null,
      guestName: data.guestName,
      amount: Number(data.amount),
      currency: data.currency || 'USD',
      collectedDate: data.collectedDate,
      status: data.status || 'held',
      refundAmount: data.refundAmount ? Number(data.refundAmount) : null,
      claimAmount: data.claimAmount ? Number(data.claimAmount) : null,
      claimReason: data.claimReason || null,
      notes: data.notes || null,
    })
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Deposit' : 'Add Security Deposit'}</DialogTitle>
          <DialogDescription>
            {item
              ? 'Update security deposit details.'
              : 'Record a new security deposit collection.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label>Property *</Label>
            <Select
              value={form.watch('propertyId')}
              onValueChange={(v) => form.setValue('propertyId', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select property' />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.propertyId && (
              <p className='text-sm text-destructive'>
                {form.formState.errors.propertyId.message}
              </p>
            )}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Guest Name *</Label>
              <Input {...form.register('guestName')} placeholder='John Doe' />
              {form.formState.errors.guestName && (
                <p className='text-sm text-destructive'>
                  {form.formState.errors.guestName.message}
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label>Reservation ID</Label>
              <Input {...form.register('reservationId')} placeholder='Optional' />
            </div>
          </div>

          <div className='grid grid-cols-3 gap-4'>
            <div className='space-y-2'>
              <Label>Amount *</Label>
              <Input type='number' step='0.01' {...form.register('amount')} placeholder='500' />
              {form.formState.errors.amount && (
                <p className='text-sm text-destructive'>
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label>Currency</Label>
              <Select
                value={form.watch('currency')}
                onValueChange={(v) => form.setValue('currency', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='USD'>USD</SelectItem>
                  <SelectItem value='EUR'>EUR</SelectItem>
                  <SelectItem value='GBP'>GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Collected Date *</Label>
              <Input type='date' {...form.register('collectedDate')} />
            </div>
          </div>

          {item && (
            <div className='space-y-2'>
              <Label>Status</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(v) => form.setValue('status', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPOSIT_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(status === 'refunded' || status === 'partially_refunded') && (
            <div className='space-y-2'>
              <Label>Refund Amount</Label>
              <Input type='number' step='0.01' {...form.register('refundAmount')} />
            </div>
          )}

          {status === 'claimed' && (
            <>
              <div className='space-y-2'>
                <Label>Claim Amount</Label>
                <Input type='number' step='0.01' {...form.register('claimAmount')} />
              </div>
              <div className='space-y-2'>
                <Label>Claim Reason</Label>
                <Textarea
                  {...form.register('claimReason')}
                  placeholder='Describe the damage or reason...'
                  rows={2}
                />
              </div>
            </>
          )}

          <div className='space-y-2'>
            <Label>Notes</Label>
            <Textarea {...form.register('notes')} placeholder='Additional notes...' rows={2} />
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit'>{item ? 'Update' : 'Add Deposit'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
