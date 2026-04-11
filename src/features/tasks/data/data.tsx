import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Circle,
  CheckCircle,
  AlertCircle,
  Timer,
  HelpCircle,
  CircleOff,
  Wrench,
  Sparkles,
  ClipboardCheck,
  Bug,
  Lightbulb,
} from 'lucide-react'

export const labels = [
  {
    value: 'maintenance',
    label: 'Maintenance',
    icon: Wrench,
  },
  {
    value: 'cleaning',
    label: 'Cleaning',
    icon: Sparkles,
  },
  {
    value: 'inspection',
    label: 'Inspection',
    icon: ClipboardCheck,
  },
  {
    value: 'bug',
    label: 'Bug',
    icon: Bug,
  },
  {
    value: 'feature',
    label: 'Feature',
    icon: Lightbulb,
  },
]

export const statuses = [
  {
    label: 'Backlog',
    value: 'backlog' as const,
    icon: HelpCircle,
  },
  {
    label: 'Todo',
    value: 'todo' as const,
    icon: Circle,
  },
  {
    label: 'In Progress',
    value: 'in_progress' as const,
    icon: Timer,
  },
  {
    label: 'Done',
    value: 'done' as const,
    icon: CheckCircle,
  },
  {
    label: 'Canceled',
    value: 'canceled' as const,
    icon: CircleOff,
  },
]

export const priorities = [
  {
    label: 'Low',
    value: 'low' as const,
    icon: ArrowDown,
  },
  {
    label: 'Medium',
    value: 'medium' as const,
    icon: ArrowRight,
  },
  {
    label: 'High',
    value: 'high' as const,
    icon: ArrowUp,
  },
  {
    label: 'Critical',
    value: 'critical' as const,
    icon: AlertCircle,
  },
]
