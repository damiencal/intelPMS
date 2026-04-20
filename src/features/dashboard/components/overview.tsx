import { useMemo } from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface RevenueEntry {
  checkIn: string
  totalPrice: number | null
  currency: string
  channel: string | null
  property: { id: string; name: string }
}

interface RevenueResponse {
  data: RevenueEntry[]
}

export function Overview() {
  const { data: revenueData } = useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: () => api.get<RevenueResponse>('/analytics/revenue?months=12'),
    select: (res) => res.data,
  })

  const chartData = useMemo(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]
    const totals = new Array(12).fill(0)

    if (revenueData) {
      for (const entry of revenueData) {
        const month = new Date(entry.checkIn).getMonth()
        totals[month] += entry.totalPrice ?? 0
      }
    }

    return months.map((name, i) => ({
      name,
      total: Math.round(totals[i]),
    }))
  }, [revenueData])

  return (
    <ResponsiveContainer width='100%' height={350}>
      <BarChart data={chartData}>
        <XAxis
          dataKey='name'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          direction='ltr'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          formatter={(value: unknown) => [`$${(value as number).toLocaleString()}`, 'Revenue']}
          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
        />
        <Bar
          dataKey='total'
          fill='currentColor'
          radius={[4, 4, 0, 0]}
          className='fill-primary'
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
