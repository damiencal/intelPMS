import { useState } from 'react'
import {
  AlertTriangle,
  DollarSign,
  Loader2,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
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
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  useInventory,
  useInventoryStats,
  useDeleteInventoryItem,
  INVENTORY_CATEGORIES,
  type InventoryItem,
} from './api'
import { InventoryDialog } from './components/inventory-dialog'

function categoryLabel(c: string) {
  return INVENTORY_CATEGORIES.find((x) => x.value === c)?.label ?? c.replace(/_/g, ' ')
}

export function Inventory() {
  const [page, setPage] = useState(1)
  const [catFilter, setCatFilter] = useState<string>('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<InventoryItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: res, isLoading } = useInventory({
    page,
    perPage: 20,
    category: catFilter || undefined,
    lowStock: lowStockOnly ? 'true' : undefined,
  })
  const { data: stats } = useInventoryStats()
  const deleteMut = useDeleteInventoryItem()

  const items = res?.data ?? []
  const meta = res?.meta

  async function handleDelete() {
    if (!deletingId) return
    try {
      await deleteMut.mutateAsync(deletingId)
      toast.success('Item deleted')
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
            <h2 className='text-2xl font-bold tracking-tight'>Inventory</h2>
            <p className='text-muted-foreground'>
              Track supplies, linens, and equipment across properties.
            </p>
          </div>
          <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>
            <Plus className='mr-2 h-4 w-4' /> Add Item
          </Button>
        </div>

        {/* Stats */}
        <div className='grid gap-4 sm:grid-cols-3'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Items</CardTitle>
              <Package className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats?.totalItems ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Low Stock</CardTitle>
              <AlertTriangle className='h-4 w-4 text-yellow-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-yellow-600'>{stats?.lowStockCount ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Value</CardTitle>
              <DollarSign className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                ${stats?.totalValue?.toLocaleString() ?? '0'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className='mt-4 flex items-center gap-4'>
          <Select value={catFilter} onValueChange={(v) => { setCatFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className='w-[170px]'>
              <SelectValue placeholder='All categories' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All categories</SelectItem>
              {INVENTORY_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={lowStockOnly ? 'default' : 'outline'}
            size='sm'
            onClick={() => { setLowStockOnly(!lowStockOnly); setPage(1) }}
          >
            <AlertTriangle className='mr-1 h-3.5 w-3.5' /> Low Stock Only
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className='flex justify-center py-20'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : items.length === 0 ? (
          <Card className='mt-4'>
            <CardContent className='flex flex-col items-center justify-center py-16'>
              <Package className='mb-4 h-12 w-12 text-muted-foreground' />
              <CardTitle className='mb-2'>No inventory items</CardTitle>
              <CardDescription>Start tracking your property supplies and equipment.</CardDescription>
            </CardContent>
          </Card>
        ) : (
          <Card className='mt-4'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Min</TableHead>
                  <TableHead>Cost/Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='w-[50px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const isLow = item.quantity <= item.minQuantity && item.minQuantity > 0
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className='font-medium'>{item.name}</p>
                        {item.supplier && <p className='text-xs text-muted-foreground'>{item.supplier}</p>}
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline'>{categoryLabel(item.category)}</Badge>
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {item.property?.name ?? 'Shared'}
                      </TableCell>
                      <TableCell className='font-medium'>
                        {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                      </TableCell>
                      <TableCell className='text-muted-foreground'>{item.minQuantity}</TableCell>
                      <TableCell>
                        {item.costPerUnit ? `$${item.costPerUnit.toFixed(2)}` : '—'}
                      </TableCell>
                      <TableCell>
                        {isLow ? (
                          <Badge variant='destructive' className='bg-yellow-100 text-yellow-800 hover:bg-yellow-200'>
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant='secondary'>In Stock</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon' className='h-7 w-7'>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem onClick={() => { setEditing(item); setDialogOpen(true) }}>
                              <Pencil className='mr-2 h-4 w-4' /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className='text-destructive' onClick={() => setDeletingId(item.id)}>
                              <Trash2 className='mr-2 h-4 w-4' /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
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

      <InventoryDialog open={dialogOpen} onOpenChange={setDialogOpen} item={editing} />
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(o) => { if (!o) setDeletingId(null) }}
        title='Delete Item'
        desc='Are you sure you want to delete this inventory item?'
        handleConfirm={handleDelete}
        isLoading={deleteMut.isPending}
      />
    </>
  )
}
