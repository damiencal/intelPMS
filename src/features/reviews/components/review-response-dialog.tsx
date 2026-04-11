import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Send, Save, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Review } from '@/features/properties/api'
import { useUpdateReview } from '@/features/properties/api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  review: Review | null
}

export function ReviewResponseDialog({ open, onOpenChange, review }: Props) {
  const [draft, setDraft] = useState('')
  const updateMutation = useUpdateReview()

  useEffect(() => {
    if (review) {
      setDraft(review.responseDraft ?? '')
    }
  }, [review])

  if (!review) return null

  async function saveDraft() {
    try {
      await updateMutation.mutateAsync({
        id: review!.id,
        responseDraft: draft,
        responseStatus: 'draft_ready',
      })
      toast.success('Draft saved')
    } catch {
      toast.error('Failed to save draft')
    }
  }

  async function markResponded() {
    try {
      await updateMutation.mutateAsync({
        id: review!.id,
        responseDraft: draft,
        responseStatus: 'responded',
        respondedAt: new Date().toISOString(),
      })
      toast.success('Marked as responded')
      onOpenChange(false)
    } catch {
      toast.error('Failed to update review')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-xl'>
        <DialogHeader>
          <DialogTitle>Respond to Review</DialogTitle>
          <DialogDescription>
            Write a response to {review.guestName ?? 'guest'}&apos;s review
          </DialogDescription>
        </DialogHeader>

        {/* Review summary */}
        <div className='rounded-lg border bg-muted/50 p-4'>
          <div className='flex items-center gap-2'>
            <span className='font-medium'>
              {review.guestName ?? 'Guest'}
            </span>
            {review.rating != null && (
              <div className='flex items-center gap-0.5'>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.round(review.rating!)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            )}
            {review.sentiment && (
              <Badge variant='outline' className='capitalize'>
                {review.sentiment}
              </Badge>
            )}
          </div>
          {review.content && (
            <p className='mt-2 text-sm text-muted-foreground'>
              {review.content}
            </p>
          )}
        </div>

        {/* Response editor */}
        <div className='space-y-2'>
          <Label htmlFor='response'>Your Response</Label>
          <Textarea
            id='response'
            rows={6}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder='Thank you for your review! We really appreciate your feedback...'
          />
          <p className='text-xs text-muted-foreground'>
            {draft.length} characters
          </p>
        </div>

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button
            variant='outline'
            onClick={saveDraft}
            disabled={updateMutation.isPending || !draft.trim()}
          >
            <Save className='mr-2 h-4 w-4' />
            Save Draft
          </Button>
          <Button
            onClick={markResponded}
            disabled={updateMutation.isPending || !draft.trim()}
          >
            <Send className='mr-2 h-4 w-4' />
            Mark as Responded
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
