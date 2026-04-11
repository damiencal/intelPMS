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
import { useProperties } from '@/features/properties/api'
import { SHIFT_TYPES, SHIFT_STATUSES, type TeamShift } from '../api'

const schema = z.object({
  assignee: z.string().min(1, 'Assignee is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  type: z.string().min(1, 'Type is required'),
  status: z.string().optional(),
  propertyId: z.string().optional(),
  hoursWorked: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  item?: TeamShift | null
  onSubmit: (data: Record<string, unknown>) => void
}

export function ShiftDialog({ open, onOpenChange, item, onSubmit }: Props) {
  const { data: properties } = useProperties()
  const propertyList = properties?.data ?? []

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      assignee: '',
      date: '',
      startTime: '09:00',
      endTime: '17:00',
      type: 'general',
      status: 'scheduled',
      propertyId: '',
      hoursWorked: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (item) {
      form.reset({
        assignee: item.assignee,
        date: item.date ? item.date.split('T')[0] : '',
        startTime: item.startTime,
        endTime: item.endTime,
        type: item.type,
        status: item.status,
        propertyId: item.propertyId ?? '',
        hoursWorked: item.hoursWorked ? String(item.hoursWorked) : '',
        notes: item.notes ?? '',
      })
    } else {
      form.reset({
        assignee: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        type: 'general',
        status: 'scheduled',
        propertyId: '',
        hoursWorked: '',
        notes: '',
      })
    }
  }, [item, open])

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit({
      ...data,
      propertyId: data.propertyId || null,
      hoursWorked: data.hoursWorked ? Number(data.hoursWorked) : null,
      notes: data.notes || null,
    })
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Shift' : 'Create Shift'}</DialogTitle>
          <DialogDescription>
            {item ? 'Update shift schedule.' : 'Schedule a new team shift.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Assignee *</Label>
              <Input {...form.register('assignee')} placeholder='Staff member name' />
              {form.formState.errors.assignee && (
                <p className='text-sm text-destructive'>{form.formState.errors.assignee.message}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label>Type *</Label>
              <Select value={form.watch('type')} onValueChange={(v) => form.setValue('type', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHIFT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid grid-cols-3 gap-4'>
            <div className='space-y-2'>
              <Label>Date *</Label>
              <Input type='date' {...form.register('date')} />
              {form.formState.errors.date && (
                <p className='text-sm text-destructive'>{form.formState.errors.date.message}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label>Start *</Label>
              <Input type='time' {...form.register('startTime')} />
            </div>

            <div className='space-y-2'>
              <Label>End *</Label>
              <Input type='time' {...form.register('endTime')} />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Property (optional)</Label>
              <Select value={form.watch('propertyId')} onValueChange={(v) => form.setValue('propertyId', v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder='Any property' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>None</SelectItem>
                  {propertyList.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {item && (
              <div className='space-y-2'>
                <Label>Status</Label>
                <Select value={form.watch('status')} onValueChange={(v) => form.setValue('status', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIFT_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {item && (
            <div className='space-y-2'>
              <Label>Hours Worked</Label>
              <Input type='number' step='0.5' {...form.register('hoursWorked')} placeholder='Actual hours' />
            </div>
          )}

          <div className='space-y-2'>
            <Label>Notes</Label>
            <Textarea {...form.register('notes')} placeholder='Additional details...' rows={3} />
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit'>{item ? 'Update' : 'Create Shift'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
