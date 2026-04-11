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
  useCreateMaintenance,
  useUpdateMaintenance,
  PRIORITIES,
  STATUSES,
  MAINTENANCE_CATEGORIES,
  type MaintenanceRequest,
} from '../api'
import { useProperties } from '@/features/properties/api'

const schema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.string().default('medium'),
  status: z.string().optional(),
  category: z.string().optional(),
  assignee: z.string().optional(),
  estimatedCost: z.coerce.number().optional(),
  scheduledDate: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  request?: MaintenanceRequest | null
}

export function MaintenanceDialog({ open, onOpenChange, request }: Props) {
  const createMut = useCreateMaintenance()
  const updateMut = useUpdateMaintenance()
  const { data: propertiesRes } = useProperties({ perPage: 100 })
  const properties = propertiesRes?.data ?? []
  const isEditing = !!request

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: request
      ? {
          propertyId: request.propertyId,
          title: request.title,
          description: request.description ?? '',
          priority: request.priority,
          status: request.status,
          category: request.category ?? '',
          assignee: request.assignee ?? '',
          estimatedCost: request.estimatedCost ?? undefined,
          scheduledDate: request.scheduledDate?.slice(0, 10) ?? '',
        }
      : {
          propertyId: '',
          title: '',
          description: '',
          priority: 'medium',
          category: '',
          assignee: '',
          scheduledDate: '',
        },
  })

  async function onSubmit(values: FormData) {
    try {
      if (isEditing && request) {
        await updateMut.mutateAsync({ id: request.id, ...values })
        toast.success('Request updated')
      } else {
        await createMut.mutateAsync(values)
        toast.success('Maintenance request created')
      }
      onOpenChange(false)
      form.reset()
    } catch {
      toast.error('Failed to save request')
    }
  }

  const isPending = createMut.isPending || updateMut.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'New'} Maintenance Request</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update request details.' : 'Log a new maintenance issue.'}
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
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.propertyId && (
              <p className='text-sm text-destructive'>{form.formState.errors.propertyId.message}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='title'>Title *</Label>
            <Input id='title' {...form.register('title')} placeholder='e.g. Leaking faucet in bathroom' />
            {form.formState.errors.title && (
              <p className='text-sm text-destructive'>{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea id='description' {...form.register('description')} rows={3} placeholder='Describe the issue...' />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Priority</Label>
              <Select
                value={form.watch('priority')}
                onValueChange={(v) => form.setValue('priority', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
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
                    {STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Category</Label>
              <Select
                value={form.watch('category') ?? ''}
                onValueChange={(v) => form.setValue('category', v === 'none' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select category' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>None</SelectItem>
                  {MAINTENANCE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='assignee'>Assignee</Label>
              <Input id='assignee' {...form.register('assignee')} placeholder='Person or company' />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='estimatedCost'>Estimated Cost</Label>
              <Input id='estimatedCost' type='number' step='0.01' {...form.register('estimatedCost')} />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='scheduledDate'>Scheduled Date</Label>
              <Input id='scheduledDate' type='date' {...form.register('scheduledDate')} />
            </div>
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={isPending}>
              {isPending ? 'Saving...' : isEditing ? 'Update' : 'Create Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
