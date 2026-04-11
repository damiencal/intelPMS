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
import { Switch } from '@/components/ui/switch'
import { FEEDBACK_SOURCES, FEEDBACK_STATUSES, type GuestFeedback } from '../api'

const schema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  reservationId: z.string().optional(),
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional().or(z.literal('')),
  overallRating: z.string().min(1, 'Overall rating is required'),
  cleanlinessRating: z.string().optional(),
  communicationRating: z.string().optional(),
  locationRating: z.string().optional(),
  valueRating: z.string().optional(),
  amenitiesRating: z.string().optional(),
  comments: z.string().optional(),
  improvements: z.string().optional(),
  wouldRecommend: z.boolean().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  item?: GuestFeedback | null
  properties: { id: string; name: string }[]
  onSubmit: (data: Record<string, unknown>) => void
}

export function FeedbackDialog({ open, onOpenChange, item, properties, onSubmit }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      propertyId: '',
      reservationId: '',
      guestName: '',
      guestEmail: '',
      overallRating: '',
      cleanlinessRating: '',
      communicationRating: '',
      locationRating: '',
      valueRating: '',
      amenitiesRating: '',
      comments: '',
      improvements: '',
      wouldRecommend: false,
      source: 'internal',
      status: 'pending',
    },
  })

  useEffect(() => {
    if (item) {
      form.reset({
        propertyId: item.propertyId,
        reservationId: item.reservationId ?? '',
        guestName: item.guestName ?? '',
        guestEmail: item.guestEmail ?? '',
        overallRating: String(item.overallRating),
        cleanlinessRating: item.cleanlinessRating ? String(item.cleanlinessRating) : '',
        communicationRating: item.communicationRating ? String(item.communicationRating) : '',
        locationRating: item.locationRating ? String(item.locationRating) : '',
        valueRating: item.valueRating ? String(item.valueRating) : '',
        amenitiesRating: item.amenitiesRating ? String(item.amenitiesRating) : '',
        comments: item.comments ?? '',
        improvements: item.improvements ?? '',
        wouldRecommend: item.wouldRecommend ?? false,
        source: item.source,
        status: item.status,
      })
    } else {
      form.reset({
        propertyId: '',
        reservationId: '',
        guestName: '',
        guestEmail: '',
        overallRating: '',
        cleanlinessRating: '',
        communicationRating: '',
        locationRating: '',
        valueRating: '',
        amenitiesRating: '',
        comments: '',
        improvements: '',
        wouldRecommend: false,
        source: 'internal',
        status: 'pending',
      })
    }
  }, [item, open])

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit({
      propertyId: data.propertyId,
      reservationId: data.reservationId || null,
      guestName: data.guestName || null,
      guestEmail: data.guestEmail || null,
      overallRating: Number(data.overallRating),
      cleanlinessRating: data.cleanlinessRating ? Number(data.cleanlinessRating) : null,
      communicationRating: data.communicationRating ? Number(data.communicationRating) : null,
      locationRating: data.locationRating ? Number(data.locationRating) : null,
      valueRating: data.valueRating ? Number(data.valueRating) : null,
      amenitiesRating: data.amenitiesRating ? Number(data.amenitiesRating) : null,
      comments: data.comments || null,
      improvements: data.improvements || null,
      wouldRecommend: data.wouldRecommend ?? null,
      source: data.source || 'internal',
      status: data.status || 'pending',
    })
    onOpenChange(false)
  })

  const ratingOptions = ['1', '2', '3', '4', '5']

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Feedback' : 'Add Guest Feedback'}</DialogTitle>
          <DialogDescription>
            {item ? 'Update feedback details.' : 'Record guest feedback for a property.'}
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
              <Label>Guest Name</Label>
              <Input {...form.register('guestName')} placeholder='John Doe' />
            </div>
            <div className='space-y-2'>
              <Label>Guest Email</Label>
              <Input {...form.register('guestEmail')} placeholder='guest@email.com' />
            </div>
          </div>

          <div className='space-y-2'>
            <Label>Reservation ID</Label>
            <Input {...form.register('reservationId')} placeholder='Optional' />
          </div>

          {/* Ratings */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Overall Rating *</Label>
              <Select
                value={form.watch('overallRating')}
                onValueChange={(v) => form.setValue('overallRating', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='1-5' />
                </SelectTrigger>
                <SelectContent>
                  {ratingOptions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {'★'.repeat(Number(r))} ({r})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Cleanliness</Label>
              <Select
                value={form.watch('cleanlinessRating')}
                onValueChange={(v) => form.setValue('cleanlinessRating', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='1-5' />
                </SelectTrigger>
                <SelectContent>
                  {ratingOptions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Communication</Label>
              <Select
                value={form.watch('communicationRating')}
                onValueChange={(v) => form.setValue('communicationRating', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='1-5' />
                </SelectTrigger>
                <SelectContent>
                  {ratingOptions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Location</Label>
              <Select
                value={form.watch('locationRating')}
                onValueChange={(v) => form.setValue('locationRating', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='1-5' />
                </SelectTrigger>
                <SelectContent>
                  {ratingOptions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Value</Label>
              <Select
                value={form.watch('valueRating')}
                onValueChange={(v) => form.setValue('valueRating', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='1-5' />
                </SelectTrigger>
                <SelectContent>
                  {ratingOptions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Amenities</Label>
              <Select
                value={form.watch('amenitiesRating')}
                onValueChange={(v) => form.setValue('amenitiesRating', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='1-5' />
                </SelectTrigger>
                <SelectContent>
                  {ratingOptions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-2'>
            <Label>Comments</Label>
            <Textarea {...form.register('comments')} placeholder='Guest comments...' rows={3} />
          </div>

          <div className='space-y-2'>
            <Label>Improvements</Label>
            <Textarea
              {...form.register('improvements')}
              placeholder='Suggested improvements...'
              rows={2}
            />
          </div>

          <div className='flex items-center gap-3'>
            <Switch
              checked={form.watch('wouldRecommend')}
              onCheckedChange={(v) => form.setValue('wouldRecommend', v)}
            />
            <Label>Would Recommend</Label>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Source</Label>
              <Select
                value={form.watch('source')}
                onValueChange={(v) => form.setValue('source', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FEEDBACK_SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                  {FEEDBACK_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit'>{item ? 'Update' : 'Add Feedback'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
