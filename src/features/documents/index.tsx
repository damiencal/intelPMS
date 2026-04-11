import { useState } from 'react'
import {
  ExternalLink,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  AlertCircle,
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
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  useDocuments,
  useDeleteDocument,
  DOCUMENT_CATEGORIES,
  type Document,
} from './api'
import { DocumentDialog } from './components/document-dialog'

function categoryLabel(c: string) {
  return DOCUMENT_CATEGORIES.find((x) => x.value === c)?.label ?? c
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatFileSize(bytes: number | null) {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isExpiringSoon(expiresAt: string | null) {
  if (!expiresAt) return false
  const diff = new Date(expiresAt).getTime() - Date.now()
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000 // 30 days
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false
  return new Date(expiresAt).getTime() < Date.now()
}

export function Documents() {
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<Document | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: res, isLoading } = useDocuments({
    page,
    perPage: 20,
    category: category || undefined,
  })
  const deleteMut = useDeleteDocument()

  const docs = res?.data ?? []
  const meta = res?.meta

  function handleAdd() { setEditingDoc(null); setDialogOpen(true) }
  function handleEdit(d: Document) { setEditingDoc(d); setDialogOpen(true) }

  async function handleDelete() {
    if (!deletingId) return
    try {
      await deleteMut.mutateAsync(deletingId)
      toast.success('Document deleted')
    } catch { toast.error('Failed to delete') }
    setDeletingId(null)
  }

  return (
    <>
      <Header>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
          <ConfigDrawer />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Documents</h2>
            <p className='text-muted-foreground'>
              Manage property leases, contracts, insurance, and more.
            </p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className='mr-2 h-4 w-4' /> Add Document
          </Button>
        </div>

        {/* Filter */}
        <div className='flex items-center gap-4'>
          <Select value={category} onValueChange={(v) => { setCategory(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='All categories' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All categories</SelectItem>
              {DOCUMENT_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className='flex justify-center py-20'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : docs.length === 0 ? (
          <Card className='mt-4'>
            <CardContent className='flex flex-col items-center justify-center py-16'>
              <FileText className='mb-4 h-12 w-12 text-muted-foreground' />
              <CardTitle className='mb-2'>No documents</CardTitle>
              <CardDescription>Add your first document.</CardDescription>
              <Button className='mt-4' onClick={handleAdd}>
                <Plus className='mr-2 h-4 w-4' /> Add Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className='mt-4'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className='w-[100px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className='font-medium'>
                      <a
                        href={d.fileUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='inline-flex items-center gap-1 hover:underline'
                      >
                        {d.name}
                        <ExternalLink className='h-3 w-3' />
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant='secondary'>{categoryLabel(d.category)}</Badge>
                    </TableCell>
                    <TableCell className='text-muted-foreground'>{d.property?.name ?? 'General'}</TableCell>
                    <TableCell className='text-muted-foreground uppercase text-xs'>{d.fileType ?? '—'}</TableCell>
                    <TableCell className='text-muted-foreground'>{formatFileSize(d.fileSize)}</TableCell>
                    <TableCell>
                      {d.expiresAt ? (
                        <div className='flex items-center gap-1'>
                          {isExpired(d.expiresAt) && (
                            <AlertCircle className='h-3.5 w-3.5 text-destructive' />
                          )}
                          {isExpiringSoon(d.expiresAt) && !isExpired(d.expiresAt) && (
                            <AlertCircle className='h-3.5 w-3.5 text-yellow-500' />
                          )}
                          <span className={isExpired(d.expiresAt) ? 'text-destructive' : ''}>
                            {formatDate(d.expiresAt)}
                          </span>
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell className='whitespace-nowrap text-muted-foreground'>{formatDate(d.createdAt)}</TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1'>
                        <Button variant='ghost' size='icon' className='h-7 w-7' onClick={() => handleEdit(d)}>
                          <Pencil className='h-3.5 w-3.5' />
                        </Button>
                        <Button variant='ghost' size='icon' className='h-7 w-7 text-destructive' onClick={() => setDeletingId(d.id)}>
                          <Trash2 className='h-3.5 w-3.5' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {meta && meta.totalPages > 1 && (
              <div className='flex items-center justify-between border-t px-4 py-3'>
                <p className='text-sm text-muted-foreground'>
                  Page {meta.page} of {meta.totalPages} ({meta.total} total)
                </p>
                <div className='flex gap-2'>
                  <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                  <Button variant='outline' size='sm' disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </Main>

      <DocumentDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditingDoc(null) }}
        document={editingDoc}
      />
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(o) => { if (!o) setDeletingId(null) }}
        title='Delete Document'
        desc='Are you sure you want to delete this document?'
        handleConfirm={handleDelete}
        isLoading={deleteMut.isPending}
      />
    </>
  )
}
