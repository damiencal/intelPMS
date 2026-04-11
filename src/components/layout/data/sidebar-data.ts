import {
  LayoutDashboard,
  Building2,
  DollarSign,
  MessagesSquare,
  Star,
  BarChart3,
  Settings,
  UserCog,
  Wrench,
  Palette,
  Bell,
  Monitor,
  Link2,
  Users,
  HelpCircle,
  ClipboardList,
  FileBarChart,
  MailPlus,
  CalendarCheck,
  Receipt,
  Hammer,
  SprayCan,
  FileText,
  BotMessageSquare,
  PieChart,
  HardHat,
  Package,
  BellRing,
  DoorOpen,
  KeyRound,
  TrendingUp,
  CalendarClock,
  FileSpreadsheet,
  GitCompareArrows,
  MessageSquareHeart,
  ShieldCheck,
  Scale,
  Crosshair,
  Heart,
  ShieldHalf,
  Plug,
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
          ],
        },
        {
          title: 'Messages',
          url: '/chats',
          icon: MessagesSquare,
        },
        {
          title: 'Templates',
          url: '/messaging',
          icon: MailPlus,
        },
        {
          title: 'Reviews',
          url: '/reviews',
          icon: Star,
        },
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
          title: 'Tasks',
          url: '/tasks',
          icon: ClipboardList,
        },
        {
          title: 'Expenses',
          url: '/expenses',
          icon: Receipt,
        },
        {
          title: 'Maintenance',
          url: '/maintenance',
          icon: Hammer,
        },
        {
          title: 'Cleaning',
          url: '/cleaning',
          icon: SprayCan,
        },
        {
          title: 'Documents',
          url: '/documents',
          icon: FileText,
        },
        {
          title: 'Auto Messages',
          url: '/auto-messages',
          icon: BotMessageSquare,
        },
        {
          title: 'Owner Statements',
          url: '/owner-statements',
          icon: PieChart,
        },
        {
          title: 'Vendors',
          url: '/vendors',
          icon: HardHat,
        },
        {
          title: 'Inventory',
          url: '/inventory',
          icon: Package,
        },
        {
          title: 'Notifications',
          url: '/notifications',
          icon: BellRing,
        },
        {
          title: 'Guest Check-in',
          url: '/guest-checkins',
          icon: DoorOpen,
        },
        {
          title: 'Key Management',
          url: '/key-handovers',
          icon: KeyRound,
        },
        {
          title: 'Revenue Forecast',
          url: '/revenue-forecast',
          icon: TrendingUp,
        },
        {
          title: 'Team Scheduling',
          url: '/team-shifts',
          icon: CalendarClock,
        },
        {
          title: 'Tax Reports',
          url: '/tax-reports',
          icon: FileSpreadsheet,
        },
        {
          title: 'Property Compare',
          url: '/property-comparison',
          icon: GitCompareArrows,
        },
        {
          title: 'Guest Feedback',
          url: '/guest-feedback',
          icon: MessageSquareHeart,
        },
        {
          title: 'Security Deposits',
          url: '/security-deposits',
          icon: ShieldCheck,
        },
        {
          title: 'Rate Parity',
          url: '/rate-parity',
          icon: Scale,
        },
        {
          title: 'Competitor Rates',
          url: '/competitor-rates',
          icon: Crosshair,
        },
        {
          title: 'Guest Loyalty',
          url: '/loyalty',
          icon: Heart,
        },
        {
          title: 'Insurance',
          url: '/insurance',
          icon: ShieldHalf,
        },
        {
          title: 'Utilities',
          url: '/utilities',
          icon: Plug,
        },
        {
          title: 'Dynamic Pricing',
          url: '/pricing-recommendations',
          icon: DollarSign,
        },
        {
          title: 'Portfolio',
          url: '/portfolio',
          icon: BarChart3,
        },
        {
          title: 'Staff Payroll',
          url: '/staff-payroll',
          icon: Receipt,
        },
        {
          title: 'Channel Sync',
          url: '/channel-sync',
          icon: Link2,
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
              icon: UserCog,
            },
            {
              title: 'Account',
              url: '/settings/account',
              icon: Wrench,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: Palette,
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
              icon: Bell,
            },
            {
              title: 'Display',
              url: '/settings/display',
              icon: Monitor,
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
