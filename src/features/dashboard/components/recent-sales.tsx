import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface Reservation {
  id: string
  guestName: string | null
  guestEmail: string | null
  totalPrice: number | null
  currency: string
  checkIn: string
  status: string
  property: { id: string; name: string; imageUrl: string | null }
}

interface ReservationsResponse {
  data: Reservation[]
  meta: { total: number }
}

function getInitials(name: string | null) {
  if (!name) return '??'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function RecentSales() {
  const { data: reservations } = useQuery({
    queryKey: ['reservations', 'recent'],
    queryFn: () => api.get<ReservationsResponse>('/reservations?per_page=5'),
    select: (res) => res.data,
  })

  if (!reservations || reservations.length === 0) {
    return (
      <p className='py-6 text-center text-sm text-muted-foreground'>
        No recent reservations
      </p>
    )
  }

  return (
    <div className='space-y-8'>
      {reservations.map((res) => (
        <div key={res.id} className='flex items-center gap-4'>
          <Avatar className='h-9 w-9'>
            <AvatarFallback>{getInitials(res.guestName)}</AvatarFallback>
          </Avatar>
          <div className='flex flex-1 flex-wrap items-center justify-between'>
            <div className='space-y-1'>
              <p className='text-sm leading-none font-medium'>
                {res.guestName || 'Guest'}
              </p>
              <p className='text-sm text-muted-foreground'>
                {res.property.name}
              </p>
            </div>
            <div className='font-medium'>
              {res.totalPrice != null
                ? `+${new Intl.NumberFormat('en-US', { style: 'currency', currency: res.currency || 'USD' }).format(res.totalPrice)}`
                : '—'}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
