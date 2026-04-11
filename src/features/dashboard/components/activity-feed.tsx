import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowDownUp,
  Bell,
  Loader2,
  MessageSquare,
  RefreshCw,
  Star,
  UserPlus,
  Webhook,
} from 'lucide-react'
import { api } from '@/lib/api'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ActivityLogEntry {
  id: string
  type: string
  description: string
  createdAt: string
  metadata: Record<string, unknown> | null
}

interface ActivityResponse {
  data: ActivityLogEntry[]
  meta: { total: number }
}

const typeIcons: Record<string, typeof Bell> = {
  sync_completed: RefreshCw,
  user_invited: UserPlus,
  webhook_reservation_created: ArrowDownUp,
  webhook_reservation_updated: ArrowDownUp,
  webhook_message_created: MessageSquare,
  webhook_review_created: Star,
  concierge_updated: Bell,
}

export function ActivityFeed() {
  const { data, isLoading } = useQuery({
    queryKey: ['activity', 'recent'],
    queryFn: () =>
      api.get<ActivityResponse>('/activity?per_page=15'),
    select: (res) => res.data,
  })

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <p className='py-6 text-center text-sm text-muted-foreground'>
        No recent activity
      </p>
    )
  }

  return (
    <ScrollArea className='h-[300px]'>
      <div className='space-y-4'>
        {data.map((entry) => {
          const Icon = typeIcons[entry.type] ?? Webhook
          return (
            <div key={entry.id} className='flex items-start gap-3'>
              <div className='mt-0.5 rounded-full bg-muted p-1.5'>
                <Icon className='h-3.5 w-3.5 text-muted-foreground' />
              </div>
              <div className='flex-1 space-y-0.5'>
                <p className='text-sm leading-snug'>{entry.description}</p>
                <p className='text-xs text-muted-foreground'>
                  {formatDistanceToNow(new Date(entry.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
