import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  useCreateExpense,
  useUpdateExpense,
  EXPENSE_CATEGORIES,
  type Expense,
} from '../api'

const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  date: z.string().min(1, 'Date is required'),
  vendor: z.string().optional(),
  notes: z.string().optional(),
  recurring: z.boolean().default(false),
})

type ExpenseForm = z.infer<typeof expenseSchema>

interface ExpenseDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  expense?: Expense | null
  propertyId?: string
}

export function ExpenseDialog({
  open,
  onOpenChange,
  expense,
  propertyId,
}: ExpenseDialogProps) {
  const createMutation = useCreateExpense()
  const updateMutation = useUpdateExpense()
  const isEditing = !!expense

  const form = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: expense
      ? {
          description: expense.description,
          category: expense.category,
          amount: expense.amount,
          date: expense.date.slice(0, 10),
          vendor: expense.vendor ?? '',
          notes: expense.notes ?? '',
          recurring: expense.recurring,
        }
      : {
          description: '',
          category: '',
          amount: 0,
          date: new Date().toISOString().slice(0, 10),
          vendor: '',
          notes: '',
          recurring: false,
        },
  })

  async function onSubmit(values: ExpenseForm) {
    try {
      if (isEditing && expense) {
        await updateMutation.mutateAsync({ id: expense.id, ...values })
        toast.success('Expense updated')
      } else {
        await createMutation.mutateAsync({
          ...values,
          propertyId: propertyId ?? undefined,
        })
        toast.success('Expense created')
      }
      onOpenChange(false)
      form.reset()
    } catch {
      toast.error('Failed to save expense')
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Add'} Expense</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update expense details.' : 'Track a new expense for your property.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='description'>Description *</Label>
            <Input id='description' {...form.register('description')} placeholder='e.g. Deep cleaning service' />
            {form.formState.errors.description && (
              <p className='text-sm text-destructive'>{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Category *</Label>
              <Select
                value={form.watch('category')}
                onValueChange={(v) => form.setValue('category', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select category' />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <p className='text-sm text-destructive'>{form.formState.errors.category.message}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='amount'>Amount *</Label>
              <Input
                id='amount'
                type='number'
                step='0.01'
                {...form.register('amount')}
              />
              {form.formState.errors.amount && (
                <p className='text-sm text-destructive'>{form.formState.errors.amount.message}</p>
              )}
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='date'>Date *</Label>
              <Input id='date' type='date' {...form.register('date')} />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='vendor'>Vendor</Label>
              <Input id='vendor' {...form.register('vendor')} placeholder='e.g. CleanCo' />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='notes'>Notes</Label>
            <Textarea id='notes' {...form.register('notes')} rows={2} placeholder='Optional notes...' />
          </div>

          <div className='flex items-center gap-2'>
            <Switch
              id='recurring'
              checked={form.watch('recurring')}
              onCheckedChange={(v) => form.setValue('recurring', v)}
            />
            <Label htmlFor='recurring'>Recurring expense</Label>
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={isPending}>
              {isPending ? 'Saving...' : isEditing ? 'Update' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
