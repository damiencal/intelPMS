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
import { useCreateGuestCheckin, useUpdateGuestCheckin, type GuestCheckin } from '../api'
import { useProperties } from '@/features/properties/api'

const schema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  reservationId: z.string().optional(),
  guestName: z.string().optional(),
  accessCode: z.string().optional(),
  wifiName: z.string().optional(),
  wifiPassword: z.string().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  instructions: z.string().optional(),
  houseRules: z.string().optional(),
  parkingInfo: z.string().optional(),
  emergencyContact: z.string().optional(),
  guidebookUrl: z.string().optional(),
  isActive: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  checkin?: GuestCheckin | null
}

export function CheckinDialog({ open, onOpenChange, checkin }: Props) {
  const createMut = useCreateGuestCheckin()
  const updateMut = useUpdateGuestCheckin()
  const { data: propRes } = useProperties({ perPage: 100 })
  const properties = propRes?.data ?? []
  const isEdit = !!checkin

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      propertyId: '', reservationId: '', guestName: '', accessCode: '',
      wifiName: '', wifiPassword: '', checkInTime: '15:00', checkOutTime: '11:00',
      instructions: '', houseRules: '', parkingInfo: '', emergencyContact: '',
      guidebookUrl: '', isActive: true,
    },
  })

  useEffect(() => {
    if (open && checkin) {
      form.reset({
        propertyId: checkin.propertyId,
        reservationId: checkin.reservationId ?? '',
        guestName: checkin.guestName ?? '',
        accessCode: checkin.accessCode ?? '',
        wifiName: checkin.wifiName ?? '',
        wifiPassword: checkin.wifiPassword ?? '',
        checkInTime: checkin.checkInTime ?? '15:00',
        checkOutTime: checkin.checkOutTime ?? '11:00',
        instructions: checkin.instructions ?? '',
        houseRules: checkin.houseRules ?? '',
        parkingInfo: checkin.parkingInfo ?? '',
        emergencyContact: checkin.emergencyContact ?? '',
        guidebookUrl: checkin.guidebookUrl ?? '',
        isActive: checkin.isActive,
      })
    } else if (open) {
      form.reset({
        propertyId: '', reservationId: '', guestName: '', accessCode: '',
        wifiName: '', wifiPassword: '', checkInTime: '15:00', checkOutTime: '11:00',
        instructions: '', houseRules: '', parkingInfo: '', emergencyContact: '',
        guidebookUrl: '', isActive: true,
      })
    }
  }, [open, checkin])

  async function onSubmit(values: FormValues) {
    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: checkin.id, ...values })
        toast.success('Check-in info updated')
      } else {
        await createMut.mutateAsync(values)
        toast.success('Check-in info created')
      }
      onOpenChange(false)
    } catch {
      toast.error('Failed to save')
    }
  }

  const isPending = createMut.isPending || updateMut.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Check-in Info' : 'New Check-in Info'}</DialogTitle>
          <DialogDescription>
            Provide check-in details and access information for guests.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='propertyId' render={({ field }) => (
                <FormItem>
                  <FormLabel>Property *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder='Select property' /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {properties.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name='guestName' render={({ field }) => (
                <FormItem>
                  <FormLabel>Guest Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className='grid grid-cols-3 gap-4'>
              <FormField control={form.control} name='accessCode' render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Code</FormLabel>
                  <FormControl><Input placeholder='Door/Lock code' {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name='checkInTime' render={({ field }) => (
                <FormItem>
                  <FormLabel>Check-in Time</FormLabel>
                  <FormControl><Input type='time' {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name='checkOutTime' render={({ field }) => (
                <FormItem>
                  <FormLabel>Check-out Time</FormLabel>
                  <FormControl><Input type='time' {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='wifiName' render={({ field }) => (
                <FormItem>
                  <FormLabel>WiFi Network</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name='wifiPassword' render={({ field }) => (
                <FormItem>
                  <FormLabel>WiFi Password</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name='instructions' render={({ field }) => (
              <FormItem>
                <FormLabel>Check-in Instructions</FormLabel>
                <FormControl><Textarea rows={3} placeholder='Step-by-step check-in instructions…' {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name='houseRules' render={({ field }) => (
              <FormItem>
                <FormLabel>House Rules</FormLabel>
                <FormControl><Textarea rows={3} placeholder='Property rules for guests…' {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name='parkingInfo' render={({ field }) => (
              <FormItem>
                <FormLabel>Parking Information</FormLabel>
                <FormControl><Textarea rows={2} placeholder='Parking instructions…' {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='emergencyContact' render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contact</FormLabel>
                  <FormControl><Input placeholder='Phone number' {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name='guidebookUrl' render={({ field }) => (
                <FormItem>
                  <FormLabel>Guidebook URL</FormLabel>
                  <FormControl><Input placeholder='https://...' {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name='isActive' render={({ field }) => (
              <FormItem className='flex items-center gap-3'>
                <FormLabel>Active</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />

            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' disabled={isPending}>
                {isPending ? 'Saving…' : isEdit ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
