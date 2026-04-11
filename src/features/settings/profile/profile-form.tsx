import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
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
import { Skeleton } from '@/components/ui/skeleton'

interface UserProfile {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
  organization: {
    id: string
    name: string
    plan: string
    timezone: string
  }
}

const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name must not be longer than 100 characters.'),
  email: z.string().email('Please enter a valid email.'),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileForm() {
  const queryClient = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => api.get<{ data: UserProfile }>('/users/me'),
    select: (res) => res.data,
  })

  const updateMutation = useMutation({
    mutationFn: (payload: ProfileFormValues) =>
      api.patch<{ data: UserProfile }>('/users/me', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] })
      toast.success('Profile updated successfully')
    },
    onError: () => {
      toast.error('Failed to update profile')
    },
  })

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    values: profile
      ? { name: profile.name, email: profile.email }
      : { name: '', email: '' },
  })

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-10 w-32' />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}
        className='space-y-6'
      >
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder='Your name' {...field} />
              </FormControl>
              <FormDescription>
                This is your display name shown to team members.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type='email' placeholder='you@example.com' {...field} />
              </FormControl>
              <FormDescription>
                Your login email. Changing this will require re-authentication.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {profile && (
          <div className='rounded-lg border p-4'>
            <h4 className='mb-2 text-sm font-medium'>Account Details</h4>
            <dl className='grid grid-cols-2 gap-2 text-sm'>
              <dt className='text-muted-foreground'>Role</dt>
              <dd className='capitalize'>{profile.role}</dd>
              <dt className='text-muted-foreground'>Organization</dt>
              <dd>{profile.organization.name}</dd>
              <dt className='text-muted-foreground'>Plan</dt>
              <dd className='capitalize'>{profile.organization.plan}</dd>
              <dt className='text-muted-foreground'>Timezone</dt>
              <dd>{profile.organization.timezone}</dd>
            </dl>
          </div>
        )}

        <Button type='submit' disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving...' : 'Update Profile'}
        </Button>
      </form>
    </Form>
  )
}
