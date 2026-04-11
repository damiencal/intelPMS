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
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useCreateVendor, useUpdateVendor, SPECIALTIES, type Vendor } from '../api'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  company: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  specialty: z.string().min(1, 'Specialty is required'),
  rating: z.coerce.number().min(1).max(5).optional().nullable(),
  hourlyRate: z.coerce.number().min(0).optional().nullable(),
  address: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendor?: Vendor | null
}

export function VendorDialog({ open, onOpenChange, vendor }: Props) {
  const createMut = useCreateVendor()
  const updateMut = useUpdateVendor()
  const isEdit = !!vendor

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      company: '',
      email: '',
      phone: '',
      specialty: '',
      rating: null,
      hourlyRate: null,
      address: '',
      notes: '',
      isActive: true,
    },
  })

  useEffect(() => {
    if (open && vendor) {
      form.reset({
        name: vendor.name,
        company: vendor.company ?? '',
        email: vendor.email ?? '',
        phone: vendor.phone ?? '',
        specialty: vendor.specialty,
        rating: vendor.rating,
        hourlyRate: vendor.hourlyRate,
        address: vendor.address ?? '',
        notes: vendor.notes ?? '',
        isActive: vendor.isActive,
      })
    } else if (open) {
      form.reset({
        name: '', company: '', email: '', phone: '', specialty: '',
        rating: null, hourlyRate: null, address: '', notes: '', isActive: true,
      })
    }
  }, [open, vendor])

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        ...values,
        email: values.email || undefined,
        rating: values.rating ?? undefined,
        hourlyRate: values.hourlyRate ?? undefined,
      }
      if (isEdit) {
        await updateMut.mutateAsync({ id: vendor.id, ...payload })
        toast.success('Vendor updated')
      } else {
        await createMut.mutateAsync(payload)
        toast.success('Vendor added')
      }
      onOpenChange(false)
    } catch {
      toast.error('Failed to save vendor')
    }
  }

  const isPending = createMut.isPending || updateMut.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update vendor details.' : 'Add a new vendor or contractor.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='name' render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name='company' render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='email' render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type='email' {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name='phone' render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='specialty' render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialty *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder='Select' /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SPECIALTIES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name='hourlyRate' render={({ field }) => (
                <FormItem>
                  <FormLabel>Hourly Rate ($)</FormLabel>
                  <FormControl>
                    <Input type='number' step='0.01' {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='rating' render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating (1-5)</FormLabel>
                  <FormControl>
                    <Input type='number' step='0.5' min='1' max='5' {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name='isActive' render={({ field }) => (
                <FormItem className='flex flex-col justify-end'>
                  <FormLabel>Active</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name='address' render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name='notes' render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl><Textarea rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' disabled={isPending}>
                {isPending ? 'Saving…' : isEdit ? 'Update' : 'Add Vendor'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
