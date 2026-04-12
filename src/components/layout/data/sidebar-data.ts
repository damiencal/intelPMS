import {
  LayoutDashboard,
  Building2,
  DollarSign,
  MessagesSquare,
  Star,
  BarChart3,
  Settings,
  Link2,
  Users,
  HelpCircle,
  ClipboardList,
  FileBarChart,
  CalendarCheck,
  Receipt,
  Hammer,
  SprayCan,
  FileText,
  PieChart,
  HardHat,
  Package,
  BellRing,
  DoorOpen,
  RefreshCw,
  Heart,
  MessageSquareHeart,
  LayoutTemplate,
  Bot,
  Key,
  CalendarClock,
  BookOpen,
  Shield,
  Zap,
  FileSearch,
  Banknote,
  Wallet,
  TrendingUp,
  ArrowLeftRight,
  LineChart,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Admin User',
    email: 'admin@hostgrowth.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'HostGrowth',
      logo: Building2,
      plan: 'Property Management',
    },
  ],
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Properties',
          url: '/properties',
          icon: Building2,
        },
        {
          title: 'Reservations',
          url: '/reservations',
          icon: CalendarCheck,
        },
      ],
    },
    {
      title: 'Messaging & Guests',
      items: [
        {
          title: 'Messages',
          url: '/chats',
          icon: MessagesSquare,
        },
        {
          title: 'Reviews',
          url: '/reviews',
          icon: Star,
        },
        {
          title: 'Guest Feedback',
          url: '/guest-feedback',
          icon: MessageSquareHeart,
        },
        {
          title: 'Guest Loyalty',
          url: '/loyalty',
          icon: Heart,
        },
        {
          title: 'Message Templates',
          url: '/messaging',
          icon: LayoutTemplate,
        },
        {
          title: 'Auto Messages',
          url: '/auto-messages',
          icon: Bot,
        },
      ],
    },
    {
      title: 'Operations',
      items: [
        {
          title: 'Tasks',
          url: '/tasks',
          icon: ClipboardList,
        },
        {
          title: 'Cleaning',
          url: '/cleaning',
          icon: SprayCan,
        },
        {
          title: 'Maintenance',
          url: '/maintenance',
          icon: Hammer,
        },
        {
          title: 'Guest Check-in',
          url: '/guest-checkins',
          icon: DoorOpen,
        },
        {
          title: 'Notifications',
          url: '/notifications',
          icon: BellRing,
        },
        {
          title: 'Key Handovers',
          url: '/key-handovers',
          icon: Key,
        },
        {
          title: 'Team Shifts',
          url: '/team-shifts',
          icon: CalendarClock,
        },
        {
          title: 'Concierge',
          url: '/concierge',
          icon: BookOpen,
        },
      ],
    },
    {
      title: 'Resources',
      items: [
        {
          title: 'Documents',
          url: '/documents',
          icon: FileText,
        },
        {
          title: 'Inventory',
          url: '/inventory',
          icon: Package,
        },
        {
          title: 'Vendors',
          url: '/vendors',
          icon: HardHat,
        },
      ],
    },
    {
      title: 'Financial',
      items: [
        {
          title: 'Expenses',
          url: '/expenses',
          icon: Receipt,
        },
        {
          title: 'Owner Statements',
          url: '/owner-statements',
          icon: PieChart,
        },
        {
          title: 'Insurance',
          url: '/insurance',
          icon: Shield,
        },
        {
          title: 'Utilities',
          url: '/utilities',
          icon: Zap,
        },
        {
          title: 'Tax Reports',
          url: '/tax-reports',
          icon: FileSearch,
        },
        {
          title: 'Security Deposits',
          url: '/security-deposits',
          icon: Banknote,
        },
        {
          title: 'Staff Payroll',
          url: '/staff-payroll',
          icon: Wallet,
        },
      ],
    },
    {
      title: 'Pricing & Revenue',
      items: [
        {
          title: 'Pricing',
          icon: DollarSign,
          items: [
            {
              title: 'Rules',
              url: '/pricing/rules',
            },
            {
              title: 'Seasonal Strategies',
              url: '/pricing/seasonal',
            },
            {
              title: 'Proposals',
              url: '/pricing/proposals',
            },
            {
              title: 'Dynamic Pricing',
              url: '/pricing-recommendations',
            },
            {
              title: 'Rate Parity',
              url: '/rate-parity',
            },
            {
              title: 'Competitor Rates',
              url: '/competitor-rates',
            },
          ],
        },
      ],
    },
    {
      title: 'Analytics & Reports',
      items: [
        {
          title: 'Analytics',
          url: '/analytics',
          icon: BarChart3,
        },
        {
          title: 'Reports',
          url: '/reports',
          icon: FileBarChart,
        },
        {
          title: 'Revenue Forecast',
          url: '/revenue-forecast',
          icon: TrendingUp,
        },
        {
          title: 'Property Comparison',
          url: '/property-comparison',
          icon: ArrowLeftRight,
        },
        {
          title: 'Portfolio',
          url: '/portfolio',
          icon: LineChart,
        },
      ],
    },
    {
      title: 'Management',
      items: [
        {
          title: 'Team',
          url: '/users',
          icon: Users,
        },
        {
          title: 'Channel Sync',
          url: '/channel-sync',
          icon: RefreshCw,
        },
        {
          title: 'Connections',
          url: '/settings/connections',
          icon: Link2,
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Settings',
          icon: Settings,
          items: [
            {
              title: 'Profile',
              url: '/settings',
            },
            {
              title: 'Account',
              url: '/settings/account',
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
            },
            {
              title: 'Display',
              url: '/settings/display',
            },
          ],
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
}
