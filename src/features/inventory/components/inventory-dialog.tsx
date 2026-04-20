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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useCreateInventoryItem, useUpdateInventoryItem, INVENTORY_CATEGORIES, type InventoryItem } from '../api'
import { useProperties } from '@/features/properties/api'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  propertyId: z.string().optional(),
  quantity: z.coerce.number().int().min(0),
  minQuantity: z.coerce.number().int().min(0),
  unit: z.string().optional(),
  costPerUnit: z.coerce.number().min(0).optional().nullable(),
  supplier: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: InventoryItem | null
}

export function InventoryDialog({ open, onOpenChange, item }: Props) {
  const createMut = useCreateInventoryItem()
  const updateMut = useUpdateInventoryItem()
  const { data: propRes } = useProperties({ perPage: 100 })
  const properties = propRes?.data ?? []
  const isEdit = !!item

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: '', category: '', propertyId: '', quantity: 0,
      minQuantity: 0, unit: '', costPerUnit: null, supplier: '', location: '', notes: '',
    },
  })

  useEffect(() => {
    if (open && item) {
      form.reset({
        name: item.name,
        category: item.category,
        propertyId: item.propertyId ?? '',
        quantity: item.quantity,
        minQuantity: item.minQuantity,
        unit: item.unit ?? '',
        costPerUnit: item.costPerUnit,
        supplier: item.supplier ?? '',
        location: item.location ?? '',
        notes: item.notes ?? '',
      })
    } else if (open) {
      form.reset({
        name: '', category: '', propertyId: '', quantity: 0,
        minQuantity: 0, unit: '', costPerUnit: null, supplier: '', location: '', notes: '',
      })
    }
  }, [open, item])

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        ...values,
        propertyId: values.propertyId || undefined,
        costPerUnit: values.costPerUnit ?? undefined,
      }
      if (isEdit) {
        await updateMut.mutateAsync({ id: item.id, ...payload })
        toast.success('Item updated')
      } else {
        await createMut.mutateAsync(payload)
        toast.success('Item added')
      }
      onOpenChange(false)
    } catch {
      toast.error('Failed to save')
    }
  }

  const isPending = createMut.isPending || updateMut.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Item' : 'Add Item'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update inventory item details.' : 'Track a new supply or equipment item.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField control={form.control} name='name' render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='category' render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder='Select' /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INVENTORY_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name='propertyId' render={({ field }) => (
                <FormItem>
                  <FormLabel>Property</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder='All / Shared' /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value=''>All / Shared</SelectItem>
                      {properties.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className='grid grid-cols-3 gap-4'>
              <FormField control={form.control} name='quantity' render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl><Input type='number' {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name='minQuantity' render={({ field }) => (
                <FormItem>
                  <FormLabel>Min Qty</FormLabel>
                  <FormControl><Input type='number' {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name='unit' render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <FormControl><Input placeholder='pcs, sets…' {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='costPerUnit' render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost/Unit ($)</FormLabel>
                  <FormControl>
                    <Input type='number' step='0.01' {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name='supplier' render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name='location' render={({ field }) => (
              <FormItem>
                <FormLabel>Storage Location</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name='notes' render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' disabled={isPending}>
                {isPending ? 'Saving…' : isEdit ? 'Update' : 'Add Item'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
