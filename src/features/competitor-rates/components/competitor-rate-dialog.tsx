import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PLATFORMS } from '../api'

const schema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  competitorName: z.string().min(1, 'Competitor name is required'),
  competitorUrl: z.string().optional(),
  platform: z.string().min(1, 'Platform is required'),
  competitorPrice: z.coerce.number().positive('Must be > 0'),
  yourPrice: z.coerce.number().positive('Must be > 0'),
  checkDate: z.string().min(1, 'Check date is required'),
  checkInDate: z.string().min(1, 'Check-in date is required'),
  checkOutDate: z.string().min(1, 'Check-out date is required'),
  guests: z.coerce.number().int().positive().optional().or(z.literal('')),
  bedrooms: z.coerce.number().int().positive().optional().or(z.literal('')),
  rating: z.coerce.number().min(0).max(5).optional().or(z.literal('')),
  reviewCount: z.coerce.number().int().min(0).optional().or(z.literal('')),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: Record<string, unknown>) => void
  isLoading?: boolean
}

export function CompetitorRateDialog({ open, onOpenChange, onSubmit, isLoading }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      propertyId: '',
      competitorName: '',
      competitorUrl: '',
      platform: 'airbnb',
      competitorPrice: '' as any,
      yourPrice: '' as any,
      checkDate: new Date().toISOString().split('T')[0],
      checkInDate: '',
      checkOutDate: '',
      guests: '' as any,
      bedrooms: '' as any,
      rating: '' as any,
      reviewCount: '' as any,
      notes: '',
    },
  })

  const { data: propertiesRes } = useQuery({
    queryKey: ['properties', 'all'],
    queryFn: () => api.get('/api/properties?per_page=100').then((r) => r.json()),
  })
  const properties = propertiesRes?.data ?? []

  useEffect(() => {
    if (!open) form.reset()
  }, [open, form])

  const handleSubmit = (values: FormValues) => {
    onSubmit({
      ...values,
      guests: values.guests || null,
      bedrooms: values.bedrooms || null,
      rating: values.rating || null,
      reviewCount: values.reviewCount || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>Add Competitor Rate</DialogTitle>
          <DialogDescription>
            Record a competitor's pricing for comparison.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='propertyId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Property</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select property' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='platform'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PLATFORMS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='competitorName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competitor Name</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. Seaside Villa' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='competitorUrl'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Listing URL</FormLabel>
                    <FormControl>
                      <Input placeholder='https://...' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-3 gap-4'>
              <FormField
                control={form.control}
                name='competitorPrice'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competitor Price</FormLabel>
                    <FormControl>
                      <Input type='number' step='0.01' placeholder='0.00' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='yourPrice'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Price</FormLabel>
                    <FormControl>
                      <Input type='number' step='0.01' placeholder='0.00' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='checkDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check Date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='checkInDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check-in Date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='checkOutDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check-out Date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-4 gap-4'>
              <FormField
                control={form.control}
                name='guests'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guests</FormLabel>
                    <FormControl>
                      <Input type='number' placeholder='—' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='bedrooms'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bedrooms</FormLabel>
                    <FormControl>
                      <Input type='number' placeholder='—' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='rating'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating</FormLabel>
                    <FormControl>
                      <Input type='number' step='0.1' max='5' placeholder='—' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='reviewCount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reviews</FormLabel>
                    <FormControl>
                      <Input type='number' placeholder='—' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder='Optional notes...' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Add Rate
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
