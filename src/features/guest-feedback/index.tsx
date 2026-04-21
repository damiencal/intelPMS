import { useState } from 'react'
import {
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Star,
  ThumbsUp,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  useGuestFeedback,
  useFeedbackStats,
  useCreateFeedback,
  useUpdateFeedback,
  useDeleteFeedback,
  FEEDBACK_STATUSES,
  type GuestFeedback,
} from './api'
import { FeedbackDialog } from './components/feedback-dialog'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  received: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  reviewed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  archived: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className='inline-flex items-center gap-0.5'>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </span>
  )
}

export default function GuestFeedbackPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<GuestFeedback | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useGuestFeedback({
    page,
    status: statusFilter || undefined,
    min_rating: ratingFilter ? Number(ratingFilter) : undefined,
  })
  const { data: statsData } = useFeedbackStats()
  const createMutation = useCreateFeedback()
  const updateMutation = useUpdateFeedback()
  const deleteMutation = useDeleteFeedback()

  const items: GuestFeedback[] = data?.data ?? []
  const meta = data?.meta
  const stats = statsData?.data
  const properties = data?.properties ?? []

  const handleSubmit = async (formData: Record<string, unknown>) => {
    try {
      if (editItem) {
        await updateMutation.mutateAsync({ id: editItem.id, ...formData })
        toast.success('Feedback updated')
      } else {
        await createMutation.mutateAsync(formData)
        toast.success('Feedback added')
      }
      setDialogOpen(false)
      setEditItem(null)
    } catch {
      toast.error('Operation failed')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Feedback deleted')
      setDeleteId(null)
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <>
      <Header>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Guest Feedback</h2>
            <p className='text-muted-foreground'>
              Collect and analyze guest feedback to improve your properties.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditItem(null)
              setDialogOpen(true)
            }}
          >
            <Plus className='mr-2 h-4 w-4' /> Add Feedback
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className='mb-6 grid gap-4 sm:grid-cols-4'>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Avg Overall Rating</CardDescription>
                <CardTitle className='text-2xl'>
                  <span className='inline-flex items-center gap-2'>
                    {stats.avgOverall > 0 ? stats.avgOverall.toFixed(1) : '—'}
                    <Star className='h-5 w-5 fill-yellow-400 text-yellow-400' />
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-xs text-muted-foreground'>{stats.total} total reviews</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Recommend Rate</CardDescription>
                <CardTitle className='text-2xl text-green-600'>
                  {stats.recommendRate.toFixed(0)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ThumbsUp className='h-4 w-4 text-green-500' />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Avg Cleanliness</CardDescription>
                <CardTitle className='text-2xl'>
                  {stats.avgCleanliness > 0 ? stats.avgCleanliness.toFixed(1) : '—'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-xs text-muted-foreground'>
                  Communication: {stats.avgCommunication > 0 ? stats.avgCommunication.toFixed(1) : '—'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Pending Reviews</CardDescription>
                <CardTitle className='text-2xl'>{stats.pending}</CardTitle>
              </CardHeader>
              <CardContent>
                <MessageSquare className='h-4 w-4 text-muted-foreground' />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className='mb-4 flex gap-3'>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v === 'all' ? '' : v)
              setPage(1)
            }}
          >
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='All Statuses' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Statuses</SelectItem>
              {FEEDBACK_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={ratingFilter}
            onValueChange={(v) => {
              setRatingFilter(v === 'all' ? '' : v)
              setPage(1)
            }}
          >
            <SelectTrigger className='w-[150px]'>
              <SelectValue placeholder='Min Rating' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Ratings</SelectItem>
              {['5', '4', '3', '2', '1'].map((r) => (
                <SelectItem key={r} value={r}>
                  {r}+ Stars
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className='flex justify-center py-12'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : (
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className='w-[50px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className='text-center text-muted-foreground py-8'>
                      No feedback found. Add your first guest feedback.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className='font-medium'>
                        {item.guestName || 'Anonymous'}
                        {item.guestEmail && (
                          <p className='text-xs text-muted-foreground'>{item.guestEmail}</p>
                        )}
                      </TableCell>
                      <TableCell>{item.property?.name ?? '—'}</TableCell>
                      <TableCell>
                        <RatingStars rating={item.overallRating} />
                      </TableCell>
                      <TableCell className='capitalize'>{item.source.replace('_', ' ')}</TableCell>
                      <TableCell>
                        <Badge variant='outline' className={statusColors[item.status] ?? ''}>
                          {FEEDBACK_STATUSES.find((s) => s.value === item.status)?.label ??
                            item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon'>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditItem(item)
                                setDialogOpen(true)
                              }}
                            >
                              <Pencil className='mr-2 h-4 w-4' /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className='text-destructive'
                              onClick={() => setDeleteId(item.id)}
                            >
                              <Trash2 className='mr-2 h-4 w-4' /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className='mt-4 flex items-center justify-between'>
            <p className='text-sm text-muted-foreground'>
              Page {meta.page} of {meta.totalPages} ({meta.total} entries)
            </p>
            <div className='flex gap-2'>
              <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={page >= meta.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Main>

      <FeedbackDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editItem}
        properties={properties}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title='Delete Feedback?'
        desc='This will permanently remove this guest feedback entry.'
        handleConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
