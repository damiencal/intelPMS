import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { PasswordInput } from '@/components/password-input'
import { useCreateChannexConnection } from './api'

const formSchema = z.object({
  label: z.string().min(1, 'Connection name is required'),
  apiKey: z.string().min(10, 'API key must be at least 10 characters'),
})

export function AddChannexConnectionDialog() {
  const [open, setOpen] = useState(false)
  const createConnection = useCreateChannexConnection()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: '',
      apiKey: '',
    },
  })

  function onSubmit(data: z.infer<typeof formSchema>) {
    createConnection.mutate(data, {
      onSuccess: () => {
        toast.success('Channex connection created! Initial sync started.')
        setOpen(false)
        form.reset()
      },
      onError: () => {
        toast.error('Failed to create connection. Check your API key.')
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className='mr-2 h-4 w-4' />
          Add Connection
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Add Channex.io Connection</DialogTitle>
          <DialogDescription>
            Enter your Channex.io user API key to connect your properties. You can
            find this in your Channex dashboard under Profile → API Access.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='label'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Connection Name</FormLabel>
                  <FormControl>
                    <Input placeholder='My Channex Account' {...field} />
                  </FormControl>
                  <FormDescription>
                    A friendly name to identify this connection.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='apiKey'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User API Key</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder='Enter your Channex API key' {...field} />
                  </FormControl>
                  <FormDescription>
                    Your personal API key from Channex.io. This is stored
                    encrypted and never exposed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setOpen(false)
                  form.reset()
                }}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={createConnection.isPending}>
                {createConnection.isPending && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                Connect
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
