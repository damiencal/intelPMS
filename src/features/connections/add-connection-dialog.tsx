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
import { useCreateConnection } from './api'

const formSchema = z.object({
  name: z.string().min(1, 'Connection name is required'),
  apiToken: z.string().min(10, 'API token must be at least 10 characters'),
})

export function AddConnectionDialog() {
  const [open, setOpen] = useState(false)
  const createConnection = useCreateConnection()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      apiToken: '',
    },
  })

  function onSubmit(data: z.infer<typeof formSchema>) {
    createConnection.mutate(data, {
      onSuccess: () => {
        toast.success('Connection created! Initial sync started.')
        setOpen(false)
        form.reset()
      },
      onError: () => {
        toast.error('Failed to create connection. Check your API token.')
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
          <DialogTitle>Add Hostex Connection</DialogTitle>
          <DialogDescription>
            Enter your Hostex API token to connect your properties. You can find
            this in your Hostex dashboard under Settings → API.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Connection Name</FormLabel>
                  <FormControl>
                    <Input placeholder='My Hostex Account' {...field} />
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
              name='apiToken'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Token</FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      placeholder='Enter your Hostex API token'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Your Hostex API v3 access token.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setOpen(false)}
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
