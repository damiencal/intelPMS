import { useState } from 'react'
import {
  Star,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Minus,
  MessageSquare,
  Pencil,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useReviews } from '@/features/properties/api'
import type { Review } from '@/features/properties/api'
import { Link } from '@tanstack/react-router'
import { ReviewResponseDialog } from './components/review-response-dialog'

const sentimentConfig = {
  positive: { icon: ThumbsUp, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  neutral: { icon: Minus, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  negative: { icon: ThumbsDown, color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
}

const responseStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  needs_response: { label: 'Needs Response', variant: 'destructive' },
  draft_ready: { label: 'Draft Ready', variant: 'secondary' },
  responded: { label: 'Responded', variant: 'default' },
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function RatingStars({ rating }: { rating: number | null }) {
  if (rating == null) return <span className='text-sm text-muted-foreground'>No rating</span>
  return (
    <div className='flex items-center gap-1'>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < Math.round(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
      <span className='ml-1 text-sm font-medium'>{rating.toFixed(1)}</span>
    </div>
  )
}

function ReviewCard({ review, onRespond }: { review: Review; onRespond: (r: Review) => void }) {
  const sentiment = review.sentiment as keyof typeof sentimentConfig | null
  const SentimentIcon = sentiment ? sentimentConfig[sentiment]?.icon : null
  const sentimentColor = sentiment ? sentimentConfig[sentiment]?.color : ''
  const responseConfig = responseStatusConfig[review.responseStatus] ?? { label: review.responseStatus, variant: 'outline' as const }

  return (
    <Card>
      <CardContent className='p-4'>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex-1'>
            <div className='flex items-center gap-3'>
              <span className='font-medium'>{review.guestName || 'Guest'}</span>
              <RatingStars rating={review.rating} />
              {sentiment && SentimentIcon && (
                <Badge variant='secondary' className={sentimentColor}>
                  <SentimentIcon className='mr-1 h-3 w-3' />
                  {sentiment}
                </Badge>
              )}
            </div>
            <div className='mt-1 flex items-center gap-2 text-sm text-muted-foreground'>
              {review.property && (
                <Link
                  to='/properties/$propertyId'
                  params={{ propertyId: review.property.id }}
                  className='hover:underline'
                >
                  {review.property.name}
                </Link>
              )}
              {review.channel && (
                <>
                  <span>·</span>
                  <span className='capitalize'>{review.channel}</span>
                </>
              )}
              <span>·</span>
              <span>{formatDate(review.reviewDate)}</span>
            </div>
            {review.content && (
              <p className='mt-3 text-sm leading-relaxed text-muted-foreground'>
                {review.content}
              </p>
            )}
            {review.responseDraft && (
              <div className='mt-3 rounded-md border border-dashed p-3'>
                <p className='text-xs font-medium text-muted-foreground mb-1'>
                  <MessageSquare className='mr-1 inline h-3 w-3' />
                  Response {review.responseStatus === 'responded' ? '' : 'Draft'}
                </p>
                <p className='text-sm'>{review.responseDraft}</p>
              </div>
            )}
          </div>
          <div className='flex flex-col items-end gap-2'>
            <Badge variant={responseConfig.variant}>
              {responseConfig.label}
            </Badge>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => onRespond(review)}
            >
              <Pencil className='mr-1 h-3 w-3' />
              {review.responseStatus === 'responded' ? 'Edit' : 'Respond'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function Reviews() {
  const [page, setPage] = useState(1)
  const [sentiment, setSentiment] = useState<string>('')
  const [responseStatus, setResponseStatus] = useState<string>('')
  const [search, setSearch] = useState('')
  const [respondingReview, setRespondingReview] = useState<Review | null>(null)

  const { data, isLoading } = useReviews({
    page,
    perPage: 12,
    sentiment: sentiment || undefined,
    responseStatus: responseStatus || undefined,
    search: search || undefined,
  })

  const reviews = data?.data ?? []
  const meta = data?.meta

  return (
    <>
      <Header>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-4'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            Reviews
          </h1>
          <p className='text-muted-foreground'>
            Manage guest reviews and response workflows.
          </p>
        </div>

        {/* Filters */}
        <div className='mb-4 flex flex-wrap items-center gap-3'>
          <Input
            placeholder='Search reviews...'
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className='w-64'
          />
          <Select value={sentiment} onValueChange={(v) => { setSentiment(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-40'>
              <SelectValue placeholder='Sentiment' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Sentiments</SelectItem>
              <SelectItem value='positive'>Positive</SelectItem>
              <SelectItem value='neutral'>Neutral</SelectItem>
              <SelectItem value='negative'>Negative</SelectItem>
            </SelectContent>
          </Select>
          <Select value={responseStatus} onValueChange={(v) => { setResponseStatus(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-48'>
              <SelectValue placeholder='Response Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Statuses</SelectItem>
              <SelectItem value='needs_response'>Needs Response</SelectItem>
              <SelectItem value='draft_ready'>Draft Ready</SelectItem>
              <SelectItem value='responded'>Responded</SelectItem>
            </SelectContent>
          </Select>
          {(sentiment || responseStatus || search) && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => { setSentiment(''); setResponseStatus(''); setSearch(''); setPage(1) }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center py-20'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-16'>
              <Star className='h-16 w-16 text-muted-foreground/50' />
              <h2 className='mt-4 text-xl font-semibold'>No reviews yet</h2>
              <p className='mt-2 max-w-md text-center text-sm text-muted-foreground'>
                {search || sentiment || responseStatus
                  ? 'No reviews match your filters. Try adjusting your search criteria.'
                  : 'Connect your Hostex account to start syncing reviews data.'}
              </p>
              {!search && !sentiment && !responseStatus && (
                <Button className='mt-6' variant='outline' asChild>
                  <Link to='/settings/connections'>Go to Connections</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className='grid gap-4'>
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} onRespond={setRespondingReview} />
              ))}
            </div>

            {meta && meta.totalPages > 1 && (
              <div className='mt-6 flex items-center justify-between'>
                <p className='text-sm text-muted-foreground'>
                  Showing {(meta.page - 1) * meta.perPage + 1}–
                  {Math.min(meta.page * meta.perPage, meta.total)} of {meta.total} reviews
                </p>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={page >= meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Main>

      <ReviewResponseDialog
        open={!!respondingReview}
        onOpenChange={(open) => !open && setRespondingReview(null)}
        review={respondingReview}
      />
    </>
  )
}
