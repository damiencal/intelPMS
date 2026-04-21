import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
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
import {
  type ChannelSyncLog,
  CHANNELS,
  SYNC_TYPES,
  SYNC_STATUS,
} from '../api'

const schema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  channel: z.string().min(1),
  syncType: z.string().min(1),
  status: z.string().min(1),
  recordsSynced: z.coerce.number().min(0).default(0),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  duration: z.coerce.number().min(0).optional().or(z.literal('')),
  details: z.string().optional(),
  errorsText: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: Record<string, unknown>) => void
  isLoading?: boolean
  defaultValues?: ChannelSyncLog | null
}

export function SyncLogDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  defaultValues,
}: Props) {
  const isEdit = !!defaultValues

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      propertyId: '',
      channel: 'airbnb',
      syncType: 'availability',
      status: 'in_progress',
      recordsSynced: 0,
      startedAt: '',
      completedAt: '',
      duration: '' as never,
      details: '',
      errorsText: '',
    },
  })

  const { data: propertiesRes } = useQuery({
    queryKey: ['properties', 'all'],
    queryFn: () => api.get('/properties?per_page=100'),
  })
  const properties = propertiesRes?.data ?? []

  useEffect(() => {
    if (open && defaultValues) {
      form.reset({
        propertyId: defaultValues.propertyId,
        channel: defaultValues.channel,
        syncType: defaultValues.syncType,
        status: defaultValues.status,
        recordsSynced: defaultValues.recordsSynced,
        startedAt: defaultValues.startedAt,
        completedAt: defaultValues.completedAt || '',
        duration: (defaultValues.duration ?? '') as never,
        details: defaultValues.details || '',
        errorsText: (defaultValues.errors || []).join('\n'),
      })
    } else if (!open) {
      form.reset()
    }
  }, [open, defaultValues, form])

  const handleSubmit = (values: FormValues) => {
    onSubmit({
      ...(isEdit ? { id: defaultValues.id } : {}),
      propertyId: values.propertyId,
      channel: values.channel,
      syncType: values.syncType,
      status: values.status,
      recordsSynced: values.recordsSynced,
      startedAt: values.startedAt || new Date().toISOString(),
      completedAt: values.completedAt || null,
      duration: values.duration || null,
      details: values.details || null,
      errors: values.errorsText
        ? values.errorsText
            .split('\n')
            .map((e) => e.trim())
            .filter(Boolean)
        : [],
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[560px]'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Sync Log' : 'Add Sync Log'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update a channel sync record.'
              : 'Create a channel sync record manually.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='propertyId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property</FormLabel>
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

            <div className='grid grid-cols-3 gap-4'>
              <FormField
                control={form.control}
                name='channel'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CHANNELS.map((ch) => (
                          <SelectItem key={ch.value} value={ch.value}>
                            {ch.label}
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
                name='syncType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SYNC_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
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
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SYNC_STATUS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-3 gap-4'>
              <FormField
                control={form.control}
                name='recordsSynced'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Records</FormLabel>
                    <FormControl>
                      <Input type='number' min='0' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='duration'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (ms)</FormLabel>
                    <FormControl>
                      <Input type='number' min='0' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='completedAt'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Completed (ISO)</FormLabel>
                    <FormControl>
                      <Input placeholder='2026-04-11T09:10:00Z' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='details'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder='Optional details' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='errorsText'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Errors (one per line)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder='Optional errors' {...field} />
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
                {isEdit ? 'Save Changes' : 'Create Log'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
