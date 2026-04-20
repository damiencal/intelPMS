import { useEffect } from 'react'
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
import {
  Form,
  FormControl,
  FormDescription,
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
import { Switch } from '@/components/ui/switch'
import type { MessageTemplate } from '../api'
import {
  TRIGGER_OPTIONS,
  CHANNEL_OPTIONS,
  useCreateTemplate,
  useUpdateTemplate,
} from '../api'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  trigger: z.string().min(1, 'Trigger is required'),
  subject: z.string().optional(),
  body: z.string().min(1, 'Message body is required'),
  channel: z.string().default('all'),
  delayMinutes: z.coerce.number().min(0).default(0),
  enabled: z.boolean().default(true),
})

type FormValues = z.infer<typeof formSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: MessageTemplate | null
}

export function TemplateDialog({ open, onOpenChange, template }: Props) {
  const isEdit = !!template
  const createMutation = useCreateTemplate()
  const updateMutation = useUpdateTemplate()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: '',
      trigger: 'booking_confirmed',
      subject: '',
      body: '',
      channel: 'all',
      delayMinutes: 0,
      enabled: true,
    },
  })

  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        trigger: template.trigger,
        subject: template.subject ?? '',
        body: template.body,
        channel: template.channel,
        delayMinutes: template.delayMinutes,
        enabled: template.enabled,
      })
    } else {
      form.reset({
        name: '',
        trigger: 'booking_confirmed',
        subject: '',
        body: '',
        channel: 'all',
        delayMinutes: 0,
        enabled: true,
      })
    }
  }, [template, form])

  async function onSubmit(values: FormValues) {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: template!.id, ...values })
        toast.success('Template updated')
      } else {
        await createMutation.mutateAsync(values)
        toast.success('Template created')
      }
      onOpenChange(false)
    } catch {
      toast.error(isEdit ? 'Failed to update template' : 'Failed to create template')
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Template' : 'Create Template'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update this automated message template.'
              : 'Create a new automated message template for guest communications.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Welcome message' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='trigger'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trigger Event</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TRIGGER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
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
                name='channel'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CHANNEL_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='subject'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Welcome to {{property_name}}!'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Use {'{{guest_name}}'}, {'{{property_name}}'},{' '}
                    {'{{check_in_date}}'} as placeholders
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='body'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message Body</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={6}
                      placeholder={`Hi {{guest_name}},\n\nWelcome to {{property_name}}! We're excited to host you.\n\nCheck-in: {{check_in_date}}\nCheck-out: {{check_out_date}}\n\nPlease let us know if you need anything!`}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Supports placeholders: {'{{guest_name}}'},{' '}
                    {'{{property_name}}'}, {'{{check_in_date}}'},{' '}
                    {'{{check_out_date}}'}, {'{{num_guests}}'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='delayMinutes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delay (minutes)</FormLabel>
                  <FormControl>
                    <Input type='number' min={0} {...field} />
                  </FormControl>
                  <FormDescription>
                    Delay after trigger event before sending (0 = immediate)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='enabled'
              render={({ field }) => (
                <FormItem className='flex items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>Active</FormLabel>
                    <FormDescription>
                      Enable or disable this template
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isPending}>
                {isPending
                  ? 'Saving...'
                  : isEdit
                    ? 'Save Changes'
                    : 'Create Template'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
