export const RULE_TYPES = [
  { value: 'base_rate', label: 'Base Rate' },
  { value: 'day_of_week', label: 'Day of Week' },
  { value: 'occupancy', label: 'Occupancy-Based' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'event', label: 'Event-Based' },
  { value: 'last_minute', label: 'Last Minute' },
  { value: 'length_of_stay', label: 'Length of Stay' },
  { value: 'gap_fill', label: 'Gap Fill' },
] as const

export const RULE_TYPE_MAP = Object.fromEntries(
  RULE_TYPES.map((t) => [t.value, t.label])
) as Record<string, string>

export const ACTION_TYPES = [
  { value: 'set_price', label: 'Set Fixed Price' },
  { value: 'adjust_percent', label: 'Adjust by Percentage' },
  { value: 'adjust_amount', label: 'Adjust by Amount' },
  { value: 'multiply', label: 'Multiply by Factor' },
] as const
