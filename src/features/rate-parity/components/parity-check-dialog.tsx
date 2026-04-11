import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
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
import { useProperties } from '@/features/properties/api'

const channelSchema = z.object({
  name: z.string().min(1, 'Channel name required'),
  price: z.string().min(1, 'Price required'),
  url: z.string().optional(),
  available: z.boolean().default(true),
})

const schema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  checkDate: z.string().min(1, 'Date is required'),
  basePrice: z.string().optional(),
  channels: z.array(channelSchema).min(1, 'Add at least one channel'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const DEFAULT_CHANNELS = [
  { name: 'Airbnb', price: '', url: '', available: true },
  { name: 'Booking.com', price: '', url: '', available: true },
  { name: 'VRBO', price: '', url: '', available: true },
  { name: 'Direct', price: '', url: '', available: true },
]

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (data: Record<string, unknown>) => void
}

export function ParityCheckDialog({ open, onOpenChange, onSubmit }: Props) {
  const { data: properties } = useProperties()
  const propertyList = properties?.data ?? []

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      propertyId: '',
      checkDate: new Date().toISOString().split('T')[0],
      basePrice: '',
      channels: DEFAULT_CHANNELS,
      notes: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'channels',
  })

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit({
      propertyId: data.propertyId,
      checkDate: data.checkDate,
      basePrice: data.basePrice ? Number(data.basePrice) : null,
      channels: data.channels.map((ch) => ({
        channel: ch.name,
        name: ch.name,
        price: Number(ch.price) || 0,
        url: ch.url || null,
        available: ch.available,
      })),
      notes: data.notes || null,
    })
    onOpenChange(false)
    form.reset({
      propertyId: '',
      checkDate: new Date().toISOString().split('T')[0],
      basePrice: '',
      channels: DEFAULT_CHANNELS,
      notes: '',
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-xl max-h-[85vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>New Rate Parity Check</DialogTitle>
          <DialogDescription>
            Enter the current prices across booking channels for comparison.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Property *</Label>
              <Select value={form.watch('propertyId')} onValueChange={(v) => form.setValue('propertyId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder='Select property' />
                </SelectTrigger>
                <SelectContent>
                  {propertyList.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.propertyId && (
                <p className='text-sm text-destructive'>{form.formState.errors.propertyId.message}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label>Check Date *</Label>
              <Input type='date' {...form.register('checkDate')} />
            </div>
          </div>

          <div className='space-y-2'>
            <Label>Base Price (your set price)</Label>
            <Input type='number' step='0.01' {...form.register('basePrice')} placeholder='e.g. 150.00' />
          </div>

          {/* Channel Prices */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label>Channel Prices *</Label>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => append({ name: '', price: '', url: '', available: true })}
              >
                <Plus className='mr-1 h-3 w-3' /> Add Channel
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className='grid grid-cols-12 gap-2 items-end'>
                <div className='col-span-4 space-y-1'>
                  {index === 0 && <Label className='text-xs'>Channel</Label>}
                  <Input
                    {...form.register(`channels.${index}.name`)}
                    placeholder='Channel name'
                  />
                </div>
                <div className='col-span-3 space-y-1'>
                  {index === 0 && <Label className='text-xs'>Price</Label>}
                  <Input
                    type='number'
                    step='0.01'
                    {...form.register(`channels.${index}.price`)}
                    placeholder='0.00'
                  />
                </div>
                <div className='col-span-4 space-y-1'>
                  {index === 0 && <Label className='text-xs'>URL (optional)</Label>}
                  <Input
                    {...form.register(`channels.${index}.url`)}
                    placeholder='https://...'
                  />
                </div>
                <div className='col-span-1'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='text-destructive'
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            ))}
            {form.formState.errors.channels && (
              <p className='text-sm text-destructive'>
                {typeof form.formState.errors.channels === 'object' && 'message' in form.formState.errors.channels
                  ? (form.formState.errors.channels as any).message
                  : 'Check channel entries'}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label>Notes</Label>
            <Textarea {...form.register('notes')} placeholder='Observations or notes...' rows={3} />
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit'>Record Check</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
