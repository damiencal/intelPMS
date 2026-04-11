import { useState } from 'react'
import {
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import type { PricingProposal, ProposalDetail } from '../api'
import {
  usePricingProposals,
  useProposalDetail,
  useApproveProposal,
  useRejectProposal,
  useApplyProposal,
} from '../api'

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: typeof Clock }> = {
  draft: { label: 'Draft', variant: 'secondary', icon: FileText },
  pending_review: { label: 'Pending Review', variant: 'outline', icon: Clock },
  approved: { label: 'Approved', variant: 'default', icon: CheckCircle2 },
  applied: { label: 'Applied', variant: 'default', icon: Zap },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
  partially_applied: { label: 'Partially Applied', variant: 'secondary', icon: Zap },
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatCurrency(amount: number | null) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function ProposalCard({ proposal, onView }: { proposal: PricingProposal; onView: () => void }) {
  const config = statusConfig[proposal.status] ?? statusConfig.draft
  const StatusIcon = config.icon

  return (
    <Card className='transition-shadow hover:shadow-md'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <Badge variant={config.variant} className='gap-1'>
            <StatusIcon className='h-3 w-3' />
            {config.label}
          </Badge>
          <span className='text-sm text-muted-foreground'>
            {formatDate(proposal.createdAt)}
          </span>
        </div>
        <CardTitle className='text-base'>
          {formatDate(proposal.dateRangeStart)} – {formatDate(proposal.dateRangeEnd)}
        </CardTitle>
        <CardDescription>
          {proposal.totalChanges} price changes · {proposal.totalListingsAffected} listings affected
        </CardDescription>
      </CardHeader>
      <CardContent className='pb-3'>
        <div className='flex items-center gap-6 text-sm'>
          <div className='flex items-center gap-1'>
            {proposal.avgPriceChangePct >= 0 ? (
              <TrendingUp className='h-4 w-4 text-green-600' />
            ) : (
              <TrendingDown className='h-4 w-4 text-red-600' />
            )}
            <span className={proposal.avgPriceChangePct >= 0 ? 'text-green-600' : 'text-red-600'}>
              {proposal.avgPriceChangePct >= 0 ? '+' : ''}{proposal.avgPriceChangePct.toFixed(1)}% avg
            </span>
          </div>
          {proposal.estimatedRevenueImpact != null && (
            <div className='text-muted-foreground'>
              Est. impact: {formatCurrency(proposal.estimatedRevenueImpact)}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant='outline' size='sm' onClick={onView}>
          View Details
          <ArrowRight className='ml-1 h-4 w-4' />
        </Button>
      </CardFooter>
    </Card>
  )
}

function ProposalDetailDialog({
  proposalId,
  open,
  onOpenChange,
}: {
  proposalId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: proposal, isLoading } = useProposalDetail(proposalId ?? '')
  const approveProposal = useApproveProposal()
  const rejectProposal = useRejectProposal()
  const applyProposal = useApplyProposal()
  const [reviewNotes, setReviewNotes] = useState('')

  const canApprove = proposal?.status === 'draft' || proposal?.status === 'pending_review'
  const canApply = proposal?.status === 'approved'

  function handleApprove() {
    if (!proposalId) return
    approveProposal.mutate(
      { id: proposalId, reviewNotes: reviewNotes || undefined },
      {
        onSuccess: () => { toast.success('Proposal approved'); onOpenChange(false) },
        onError: () => toast.error('Failed to approve proposal'),
      }
    )
  }

  function handleReject() {
    if (!proposalId) return
    rejectProposal.mutate(
      { id: proposalId, reviewNotes: reviewNotes || undefined },
      {
        onSuccess: () => { toast.success('Proposal rejected'); onOpenChange(false) },
        onError: () => toast.error('Failed to reject proposal'),
      }
    )
  }

  function handleApply() {
    if (!proposalId) return
    applyProposal.mutate(proposalId, {
      onSuccess: () => { toast.success('Proposal applied to Hostex'); onOpenChange(false) },
      onError: () => toast.error('Failed to apply proposal'),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[85vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Proposal Details</DialogTitle>
          <DialogDescription>
            Review and manage this pricing proposal
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className='flex items-center justify-center py-10'>
            <Loader2 className='h-6 w-6 animate-spin' />
          </div>
        ) : proposal ? (
          <div className='space-y-4'>
            {/* Summary */}
            <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
              <div>
                <p className='text-sm text-muted-foreground'>Date Range</p>
                <p className='font-medium'>{formatDate(proposal.dateRangeStart)} – {formatDate(proposal.dateRangeEnd)}</p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Status</p>
                <Badge variant={statusConfig[proposal.status]?.variant ?? 'outline'}>
                  {statusConfig[proposal.status]?.label ?? proposal.status}
                </Badge>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Avg Change</p>
                <p className={`font-medium ${proposal.avgPriceChangePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {proposal.avgPriceChangePct >= 0 ? '+' : ''}{proposal.avgPriceChangePct.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Revenue Impact</p>
                <p className='font-medium'>{formatCurrency(proposal.estimatedRevenueImpact)}</p>
              </div>
            </div>

            {/* Changes table */}
            {proposal.changes.length > 0 && (
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className='text-right'>Current</TableHead>
                      <TableHead className='text-right'>Recommended</TableHead>
                      <TableHead className='text-right'>Change</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proposal.changes.slice(0, 50).map((change) => (
                      <TableRow key={change.id} className={!change.included ? 'opacity-50' : ''}>
                        <TableCell className='font-medium'>
                          {change.listing.property.name}
                        </TableCell>
                        <TableCell className='capitalize'>
                          {change.listing.channelName || change.listing.channel}
                        </TableCell>
                        <TableCell>{formatDate(change.date)}</TableCell>
                        <TableCell className='text-right'>
                          {formatCurrency(change.currentPrice)}
                        </TableCell>
                        <TableCell className='text-right font-medium'>
                          {formatCurrency(change.recommendedPrice)}
                        </TableCell>
                        <TableCell className={`text-right ${change.changePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {change.changePct >= 0 ? '+' : ''}{change.changePct.toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          {change.applyStatus && (
                            <Badge variant={change.applyStatus === 'success' ? 'default' : change.applyStatus === 'failed' ? 'destructive' : 'secondary'}>
                              {change.applyStatus}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {proposal.changes.length > 50 && (
                  <p className='p-2 text-center text-sm text-muted-foreground'>
                    Showing 50 of {proposal.changes.length} changes
                  </p>
                )}
              </div>
            )}

            {/* Review notes */}
            {canApprove && (
              <div>
                <label className='text-sm font-medium'>Review Notes (optional)</label>
                <Textarea
                  className='mt-1'
                  placeholder='Add notes about this proposal...'
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>
            )}

            {proposal.reviewNotes && (
              <div className='rounded-md border p-3'>
                <p className='text-xs font-medium text-muted-foreground'>Review Notes</p>
                <p className='text-sm'>{proposal.reviewNotes}</p>
              </div>
            )}
          </div>
        ) : (
          <p className='py-6 text-center text-muted-foreground'>Proposal not found</p>
        )}

        <DialogFooter className='gap-2'>
          {canApprove && (
            <>
              <Button
                variant='destructive'
                onClick={handleReject}
                disabled={rejectProposal.isPending}
              >
                {rejectProposal.isPending && <Loader2 className='mr-1 h-4 w-4 animate-spin' />}
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                disabled={approveProposal.isPending}
              >
                {approveProposal.isPending && <Loader2 className='mr-1 h-4 w-4 animate-spin' />}
                Approve
              </Button>
            </>
          )}
          {canApply && (
            <Button onClick={handleApply} disabled={applyProposal.isPending}>
              {applyProposal.isPending && <Loader2 className='mr-1 h-4 w-4 animate-spin' />}
              <Zap className='mr-1 h-4 w-4' />
              Apply to Hostex
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PricingProposals() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const { data, isLoading } = usePricingProposals({
    page,
    perPage: 12,
    status: statusFilter || undefined,
  })

  const proposals = data?.data ?? []
  const meta = data?.meta

  function handleView(proposalId: string) {
    setSelectedProposalId(proposalId)
    setDetailOpen(true)
  }

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
        <div className='mb-4 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
              Pricing Proposals
            </h1>
            <p className='text-muted-foreground'>
              Review and approve AI-generated pricing proposals.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className='mb-4 flex items-center gap-3'>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-48'>
              <SelectValue placeholder='All Statuses' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Statuses</SelectItem>
              <SelectItem value='draft'>Draft</SelectItem>
              <SelectItem value='pending_review'>Pending Review</SelectItem>
              <SelectItem value='approved'>Approved</SelectItem>
              <SelectItem value='applied'>Applied</SelectItem>
              <SelectItem value='rejected'>Rejected</SelectItem>
            </SelectContent>
          </Select>
          {statusFilter && (
            <Button variant='ghost' size='sm' onClick={() => { setStatusFilter(''); setPage(1) }}>
              Clear
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center py-20'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : proposals.length === 0 ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-16'>
              <FileText className='h-16 w-16 text-muted-foreground/50' />
              <h2 className='mt-4 text-xl font-semibold'>No proposals yet</h2>
              <p className='mt-2 max-w-md text-center text-sm text-muted-foreground'>
                Pricing proposals will appear here when the AI pricing engine generates
                recommendations. Set up pricing rules first.
              </p>
              <Button className='mt-6' variant='outline' asChild>
                <Link to='/pricing/rules'>Go to Pricing Rules</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {proposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onView={() => handleView(proposal.id)}
                />
              ))}
            </div>

            {meta && meta.totalPages > 1 && (
              <div className='mt-6 flex items-center justify-between'>
                <p className='text-sm text-muted-foreground'>
                  Page {meta.page} of {meta.totalPages} ({meta.total} total)
                </p>
                <div className='flex items-center gap-2'>
                  <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <Button variant='outline' size='sm' disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Main>

      <ProposalDetailDialog
        proposalId={selectedProposalId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  )
}
