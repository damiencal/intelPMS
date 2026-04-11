import { Crown, Shield, Eye } from 'lucide-react'

export const roles = [
  {
    label: 'Owner',
    value: 'owner',
    icon: Crown,
  },
  {
    label: 'Manager',
    value: 'manager',
    icon: Shield,
  },
  {
    label: 'Viewer',
    value: 'viewer',
    icon: Eye,
  },
] as const
