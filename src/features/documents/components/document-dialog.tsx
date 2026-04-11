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
  useCreateDocument,
  useUpdateDocument,
  DOCUMENT_CATEGORIES,
  type Document,
} from '../api'
import { useProperties } from '@/features/properties/api'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  fileUrl: z.string().url('Valid URL is required'),
  propertyId: z.string().optional(),
  fileType: z.string().optional(),
  expiresAt: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  document?: Document | null
}

export function DocumentDialog({ open, onOpenChange, document: doc }: Props) {
  const createMut = useCreateDocument()
  const updateMut = useUpdateDocument()
  const { data: propertiesRes } = useProperties({ perPage: 100 })
  const properties = propertiesRes?.data ?? []
  const isEditing = !!doc

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: doc
      ? {
          name: doc.name,
          category: doc.category,
          fileUrl: doc.fileUrl,
          propertyId: doc.propertyId ?? '',
          fileType: doc.fileType ?? '',
          expiresAt: doc.expiresAt?.slice(0, 10) ?? '',
          notes: doc.notes ?? '',
        }
      : {
          name: '',
          category: '',
          fileUrl: '',
          propertyId: '',
          fileType: '',
          expiresAt: '',
          notes: '',
        },
  })

  async function onSubmit(values: FormData) {
    try {
      const payload = {
        ...values,
        propertyId: values.propertyId || undefined,
        expiresAt: values.expiresAt || undefined,
      }
      if (isEditing && doc) {
        await updateMut.mutateAsync({ id: doc.id, ...payload })
        toast.success('Document updated')
      } else {
        await createMut.mutateAsync(payload)
        toast.success('Document added')
      }
      onOpenChange(false)
      form.reset()
    } catch {
      toast.error('Failed to save document')
    }
  }

  const isPending = createMut.isPending || updateMut.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Add'} Document</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update document details.' : 'Add a new document to your library.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Name *</Label>
            <Input id='name' {...form.register('name')} placeholder='e.g. Property lease agreement' />
            {form.formState.errors.name && (
              <p className='text-sm text-destructive'>{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Category *</Label>
              <Select
                value={form.watch('category')}
                onValueChange={(v) => form.setValue('category', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select category' />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>Property</Label>
              <Select
                value={form.watch('propertyId') ?? ''}
                onValueChange={(v) => form.setValue('propertyId', v === 'none' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='All / General' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>General (no property)</SelectItem>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='fileUrl'>File URL *</Label>
            <Input id='fileUrl' {...form.register('fileUrl')} placeholder='https://...' />
            {form.formState.errors.fileUrl && (
              <p className='text-sm text-destructive'>{form.formState.errors.fileUrl.message}</p>
            )}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='fileType'>File Type</Label>
              <Input id='fileType' {...form.register('fileType')} placeholder='pdf, docx, etc.' />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='expiresAt'>Expires</Label>
              <Input id='expiresAt' type='date' {...form.register('expiresAt')} />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='notes'>Notes</Label>
            <Textarea id='notes' {...form.register('notes')} rows={2} />
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type='submit' disabled={isPending}>
              {isPending ? 'Saving...' : isEditing ? 'Update' : 'Add Document'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
