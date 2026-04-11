import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
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
import {
  useCreateCleaning,
  useUpdateCleaning,
  CLEANING_TYPES,
  CLEANING_STATUSES,
  type CleaningSchedule,
} from '../api'
import { useProperties } from '@/features/properties/api'

const schema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  type: z.string().min(1, 'Type is required'),
  scheduledDate: z.string().min(1, 'Date is required'),
  scheduledTime: z.string().optional(),
  assignee: z.string().optional(),
  estimatedHours: z.coerce.number().optional(),
  cost: z.coerce.number().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  schedule?: CleaningSchedule | null
}

export function CleaningDialog({ open, onOpenChange, schedule }: Props) {
  const createMut = useCreateCleaning()
  const updateMut = useUpdateCleaning()
  const { data: propertiesRes } = useProperties({ perPage: 100 })
  const properties = propertiesRes?.data ?? []
  const isEditing = !!schedule

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: schedule
      ? {
          propertyId: schedule.propertyId,
          type: schedule.type,
          scheduledDate: schedule.scheduledDate.slice(0, 10),
          scheduledTime: schedule.scheduledTime ?? '',
          assignee: schedule.assignee ?? '',
          estimatedHours: schedule.estimatedHours ?? undefined,
          cost: schedule.cost ?? undefined,
          notes: schedule.notes ?? '',
          status: schedule.status,
        }
      : {
          propertyId: '',
          type: 'turnover',
          scheduledDate: new Date().toISOString().slice(0, 10),
          scheduledTime: '',
          assignee: '',
          notes: '',
        },
  })

  async function onSubmit(values: FormData) {
    try {
      if (isEditing && schedule) {
        await updateMut.mutateAsync({ id: schedule.id, ...values })
        toast.success('Schedule updated')
      } else {
        await createMut.mutateAsync(values)
        toast.success('Cleaning scheduled')
      }
      onOpenChange(false)
      form.reset()
    } catch {
      toast.error('Failed to save')
    }
  }

  const isPending = createMut.isPending || updateMut.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Schedule'} Cleaning</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update cleaning schedule.' : 'Schedule a cleaning for a property.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
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
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Type *</Label>
              <Select
                value={form.watch('type')}
                onValueChange={(v) => form.setValue('type', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLEANING_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isEditing && (
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
                    {CLEANING_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='scheduledDate'>Date *</Label>
              <Input id='scheduledDate' type='date' {...form.register('scheduledDate')} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='scheduledTime'>Time</Label>
              <Input id='scheduledTime' type='time' {...form.register('scheduledTime')} />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='assignee'>Assignee</Label>
              <Input id='assignee' {...form.register('assignee')} placeholder='Cleaner name' />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='estimatedHours'>Est. Hours</Label>
              <Input id='estimatedHours' type='number' step='0.5' {...form.register('estimatedHours')} />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='cost'>Cost</Label>
            <Input id='cost' type='number' step='0.01' {...form.register('cost')} />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='notes'>Notes</Label>
            <Textarea id='notes' {...form.register('notes')} rows={2} placeholder='Special instructions...' />
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type='submit' disabled={isPending}>
              {isPending ? 'Saving...' : isEditing ? 'Update' : 'Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
