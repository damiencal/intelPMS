import { useState } from 'react'
import {
  ArrowDownUp,
  Building2,
  DollarSign,
  Loader2,
  Percent,
  Star,
  TrendingUp,
} from 'lucide-react'
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
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { usePropertyComparison, type PropertyComparison } from './api'

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v)
}

type SortKey = keyof PropertyComparison
type SortDir = 'asc' | 'desc'

export default function PropertyComparisonPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [sortKey, setSortKey] = useState<SortKey>('totalRevenue')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const { data, isLoading } = usePropertyComparison(year)

  const properties = data?.data ?? []
  const summary = data?.summary

  const sorted = [...properties].sort((a, b) => {
    const aVal = a[sortKey] as number
    const bVal = b[sortKey] as number
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal
  })

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <TableHead
      className='cursor-pointer select-none text-right hover:text-foreground'
      onClick={() => toggleSort(field)}
    >
      <span className='inline-flex items-center gap-1'>
        {label}
        {sortKey === field && (
          <ArrowDownUp className='h-3 w-3' />
        )}
      </span>
    </TableHead>
  )

  const maxRevenue = Math.max(...properties.map((p) => p.totalRevenue), 1)

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
            <h2 className='text-2xl font-bold tracking-tight'>Property Comparison</h2>
            <p className='text-muted-foreground'>
              Side-by-side performance comparison across your portfolio.
            </p>
          </div>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className='w-[120px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Portfolio Summary */}
        {summary && (
          <div className='mb-6 grid gap-4 sm:grid-cols-4'>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Properties</CardDescription>
                <CardTitle className='text-2xl'>{summary.totalProperties}</CardTitle>
              </CardHeader>
              <CardContent>
                <Building2 className='h-4 w-4 text-muted-foreground' />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Total Revenue</CardDescription>
                <CardTitle className='text-2xl text-green-600'>
                  {formatCurrency(summary.totalRevenue)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DollarSign className='h-4 w-4 text-green-500' />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Avg Occupancy</CardDescription>
                <CardTitle className='text-2xl'>
                  {summary.avgOccupancy.toFixed(1)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Percent className='h-4 w-4 text-blue-500' />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Net Income</CardDescription>
                <CardTitle
                  className={`text-2xl ${summary.totalNetIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatCurrency(summary.totalNetIncome)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TrendingUp className='h-4 w-4 text-muted-foreground' />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Comparison Table */}
        {isLoading ? (
          <div className='flex justify-center py-12'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : (
          <div className='rounded-md border overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='sticky left-0 bg-background min-w-[180px]'>
                    Property
                  </TableHead>
                  <SortHeader label='Revenue' field='totalRevenue' />
                  <SortHeader label='Expenses' field='totalExpenses' />
                  <SortHeader label='Net Income' field='netIncome' />
                  <SortHeader label='Margin' field='margin' />
                  <SortHeader label='Bookings' field='totalBookings' />
                  <SortHeader label='Occupancy' field='occupancyRate' />
                  <SortHeader label='Avg/Night' field='avgNightlyRate' />
                  <SortHeader label='RevPAR' field='revPAR' />
                  <SortHeader label='Rating' field='avgRating' />
                  <SortHeader label='Reviews' field='totalReviews' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className='text-center text-muted-foreground py-8'
                    >
                      No properties to compare.
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map((p) => (
                    <TableRow key={p.propertyId}>
                      <TableCell className='sticky left-0 bg-background font-medium'>
                        <div className='space-y-1'>
                          <span>{p.propertyName}</span>
                          <div
                            className='h-1.5 rounded-full bg-green-500/70'
                            style={{
                              width: `${(p.totalRevenue / maxRevenue) * 100}%`,
                            }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className='text-right font-medium text-green-600'>
                        {formatCurrency(p.totalRevenue)}
                      </TableCell>
                      <TableCell className='text-right text-red-600'>
                        {formatCurrency(p.totalExpenses)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${p.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {formatCurrency(p.netIncome)}
                      </TableCell>
                      <TableCell className='text-right'>
                        {p.margin.toFixed(1)}%
                      </TableCell>
                      <TableCell className='text-right'>{p.totalBookings}</TableCell>
                      <TableCell className='text-right'>
                        <span
                          className={
                            p.occupancyRate >= 70
                              ? 'text-green-600'
                              : p.occupancyRate >= 40
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }
                        >
                          {p.occupancyRate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(p.avgNightlyRate)}
                      </TableCell>
                      <TableCell className='text-right'>
                        {formatCurrency(p.revPAR)}
                      </TableCell>
                      <TableCell className='text-right'>
                        <span className='inline-flex items-center gap-1'>
                          <Star className='h-3 w-3 fill-yellow-400 text-yellow-400' />
                          {p.avgRating > 0 ? p.avgRating.toFixed(1) : '—'}
                        </span>
                      </TableCell>
                      <TableCell className='text-right'>{p.totalReviews}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Main>
    </>
  )
}
