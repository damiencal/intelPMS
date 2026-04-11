import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { PERIODS, TAX_STATUSES, type TaxReport } from '../api'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  period: z.string().min(1, 'Period is required'),
  year: z.string().min(1, 'Year is required'),
  quarter: z.string().optional(),
  month: z.string().optional(),
  taxRate: z.string().optional(),
  status: z.string().optional(),
  autoGenerate: z.boolean().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  item?: TaxReport | null
  onSubmit: (data: Record<string, unknown>) => void
}

export function TaxReportDialog({ open, onOpenChange, item, onSubmit }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      period: 'quarterly',
      year: String(new Date().getFullYear()),
      quarter: '',
      month: '',
      taxRate: '',
      status: 'draft',
      autoGenerate: true,
      notes: '',
    },
  })

  const period = form.watch('period')

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        period: item.period,
        year: String(item.year),
        quarter: item.quarter ? String(item.quarter) : '',
        month: item.month ? String(item.month) : '',
        taxRate: item.taxRate ? String(item.taxRate) : '',
        status: item.status,
        autoGenerate: false,
        notes: item.notes ?? '',
      })
    } else {
      form.reset({
        name: '',
        period: 'quarterly',
        year: String(new Date().getFullYear()),
        quarter: '',
        month: '',
        taxRate: '',
        status: 'draft',
        autoGenerate: true,
        notes: '',
      })
    }
  }, [item, open])

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit({
      name: data.name,
      period: data.period,
      year: Number(data.year),
      quarter: data.quarter ? Number(data.quarter) : null,
      month: data.month ? Number(data.month) : null,
      taxRate: data.taxRate ? Number(data.taxRate) : null,
      status: data.status || 'draft',
      autoGenerate: data.autoGenerate ?? false,
      notes: data.notes || null,
    })
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Tax Report' : 'Generate Tax Report'}</DialogTitle>
          <DialogDescription>
            {item ? 'Update tax report details.' : 'Generate a new tax report from your financial data.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label>Report Name *</Label>
            <Input {...form.register('name')} placeholder='e.g. Q1 2026 Tax Report' />
            {form.formState.errors.name && (
              <p className='text-sm text-destructive'>{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Period *</Label>
              <Select value={form.watch('period')} onValueChange={(v) => form.setValue('period', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>Year *</Label>
              <Select value={form.watch('year')} onValueChange={(v) => form.setValue('year', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {period === 'quarterly' && (
            <div className='space-y-2'>
              <Label>Quarter</Label>
              <Select value={form.watch('quarter')} onValueChange={(v) => form.setValue('quarter', v)}>
                <SelectTrigger>
                  <SelectValue placeholder='Select quarter' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='1'>Q1 (Jan-Mar)</SelectItem>
                  <SelectItem value='2'>Q2 (Apr-Jun)</SelectItem>
                  <SelectItem value='3'>Q3 (Jul-Sep)</SelectItem>
                  <SelectItem value='4'>Q4 (Oct-Dec)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {period === 'monthly' && (
            <div className='space-y-2'>
              <Label>Month</Label>
              <Select value={form.watch('month')} onValueChange={(v) => form.setValue('month', v)}>
                <SelectTrigger>
                  <SelectValue placeholder='Select month' />
                </SelectTrigger>
                <SelectContent>
                  {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Tax Rate (%)</Label>
              <Input type='number' step='0.1' {...form.register('taxRate')} placeholder='e.g. 25' />
            </div>

            {item && (
              <div className='space-y-2'>
                <Label>Status</Label>
                <Select value={form.watch('status')} onValueChange={(v) => form.setValue('status', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TAX_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {!item && (
            <div className='flex items-center gap-3 rounded-lg border p-3'>
              <Switch
                checked={form.watch('autoGenerate')}
                onCheckedChange={(v) => form.setValue('autoGenerate', v)}
              />
              <div>
                <p className='text-sm font-medium'>Auto-generate from data</p>
                <p className='text-xs text-muted-foreground'>Calculate income & expenses from reservations and expense records</p>
              </div>
            </div>
          )}

          <div className='space-y-2'>
            <Label>Notes</Label>
            <Textarea {...form.register('notes')} placeholder='Additional notes...' rows={3} />
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit'>{item ? 'Update' : 'Generate Report'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
