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
import { KEY_TYPES, KEY_STATUSES, type KeyHandover } from '../api'

const schema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  keyType: z.string().min(1, 'Key type is required'),
  keyIdentifier: z.string().min(1, 'Key identifier is required'),
  assignedTo: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  item?: KeyHandover | null
  onSubmit: (data: Record<string, unknown>) => void
}

export function KeyHandoverDialog({ open, onOpenChange, item, onSubmit }: Props) {
  const { data: properties } = useProperties()
  const propertyList = properties?.data ?? []

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      propertyId: '',
      keyType: 'physical',
      keyIdentifier: '',
      assignedTo: '',
      status: 'available',
      notes: '',
    },
  })

  useEffect(() => {
    if (item) {
      form.reset({
        propertyId: item.propertyId,
        keyType: item.keyType,
        keyIdentifier: item.keyIdentifier,
        assignedTo: item.assignedTo ?? '',
        status: item.status,
        notes: item.notes ?? '',
      })
    } else {
      form.reset({
        propertyId: '',
        keyType: 'physical',
        keyIdentifier: '',
        assignedTo: '',
        status: 'available',
        notes: '',
      })
    }
  }, [item, open])

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit({
      ...data,
      assignedTo: data.assignedTo || null,
      notes: data.notes || null,
    })
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Key' : 'Add Key'}</DialogTitle>
          <DialogDescription>
            {item ? 'Update key/access details.' : 'Add a new key or access device.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
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

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Key Type *</Label>
              <Select value={form.watch('keyType')} onValueChange={(v) => form.setValue('keyType', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KEY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>Identifier / Code *</Label>
              <Input {...form.register('keyIdentifier')} placeholder='Key #, code, etc.' />
              {form.formState.errors.keyIdentifier && (
                <p className='text-sm text-destructive'>{form.formState.errors.keyIdentifier.message}</p>
              )}
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Assigned To</Label>
              <Input {...form.register('assignedTo')} placeholder='Person or team' />
            </div>

            {item && (
              <div className='space-y-2'>
                <Label>Status</Label>
                <Select value={form.watch('status')} onValueChange={(v) => form.setValue('status', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KEY_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className='space-y-2'>
            <Label>Notes</Label>
            <Textarea {...form.register('notes')} placeholder='Additional details...' rows={3} />
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit'>{item ? 'Update' : 'Add Key'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
