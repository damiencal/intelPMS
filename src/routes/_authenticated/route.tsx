import { createFileRoute, redirect } from '@tanstack/react-router'
import { fetchCurrentUser } from '@/hooks/use-auth'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const user = await fetchCurrentUser()
    if (!user) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      })
    }
    return { user }
  },
  component: AuthenticatedLayout,
})
