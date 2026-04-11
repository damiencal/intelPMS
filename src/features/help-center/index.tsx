import { useState } from 'react'
import {
  BookOpen,
  ChevronDown,
  ExternalLink,
  HelpCircle,
  LifeBuoy,
  MessageCircle,
  Search as SearchIcon,
  Settings,
  Zap,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'

// ---- Data ----

interface FaqItem {
  question: string
  answer: string
  tags: string[]
}

interface GuideItem {
  title: string
  description: string
  icon: React.ElementType
  link: string
}

const faqs: FaqItem[] = [
  {
    question: 'How do I connect my Hostex account?',
    answer:
      'Go to Settings → Connections and click "Add Connection". Enter your Hostex API token (found in your Hostex dashboard under API settings). Once connected, your properties, reservations, and reviews will be synced automatically.',
    tags: ['setup', 'connections'],
  },
  {
    question: 'How does the initial data sync work?',
    answer:
      'After connecting your Hostex account, we run a full sync that imports all your properties, listings, reservations, reviews, and conversations. This typically takes 1-5 minutes depending on how much data you have. You can monitor progress in the activity feed on your dashboard.',
    tags: ['sync', 'setup'],
  },
  {
    question: 'How do I manage pricing for my listings?',
    answer:
      'Navigate to Pricing → Rules to set up base pricing rules (weekend markup, last-minute discounts, etc.). Use Pricing → Seasonal to create seasonal strategies. pricing proposals will be generated automatically and can be reviewed under Pricing → Proposals.',
    tags: ['pricing'],
  },
  {
    question: 'What are pricing proposals?',
    answer:
      'Pricing proposals are AI-generated suggestions to optimize your listing prices based on your rules, seasonal strategies, market conditions, and occupancy patterns. You can review, approve, or reject each proposal before it\'s applied to your listings.',
    tags: ['pricing'],
  },
  {
    question: 'How do I set up concierge knowledge for a property?',
    answer:
      'Open a property detail page and click the "Concierge" tab. Fill in the fields for check-in instructions, house rules, local restaurants, activities, transportation, and custom notes. This information powers AI-assisted guest messaging.',
    tags: ['concierge', 'messaging'],
  },
  {
    question: 'How does the automated guest messaging work?',
    answer:
      'Guest messages from Hostex are synced to the Chats section. The system can use your concierge knowledge to draft AI-powered responses. You can review and send these responses, or compose your own. Message templates are coming soon.',
    tags: ['messaging', 'ai'],
  },
  {
    question: 'Can I assign tasks to team members?',
    answer:
      'Yes! Go to Tasks and create a new task. You can set the status, priority, label (maintenance, cleaning, inspection, etc.), and assign it to team members. Bulk status and priority updates are also supported.',
    tags: ['tasks'],
  },
  {
    question: 'How do I add team members?',
    answer:
      'Navigate to Users and click "Add User" or "Invite User". You can assign roles: Owner (full access), Manager (can edit everything except billing), or Viewer (read-only access).',
    tags: ['users', 'team'],
  },
  {
    question: 'What data is shown on the analytics page?',
    answer:
      'The analytics page shows revenue trends over 12 months, occupancy rates per property (based on calendar data), review sentiment distribution, and channel-wise booking breakdown.',
    tags: ['analytics'],
  },
  {
    question: 'How do calendar entries get updated?',
    answer:
      'Calendar entries can come from Hostex sync (availability, pricing) or be manually edited on the property detail page\'s Calendar tab. Changes to availability and pricing are saved locally and can optionally be pushed back to Hostex.',
    tags: ['calendar'],
  },
  {
    question: 'How do I handle negative reviews?',
    answer:
      'Go to Reviews to see all reviews with their sentiment analysis. Reviews flagged as "negative" have a red badge. Click on a review to see the AI-drafted response suggestion, which you can edit and send.',
    tags: ['reviews'],
  },
  {
    question: 'What webhook events does the system process?',
    answer:
      'We process reservation_created, reservation_updated, calendar_updated, message_created, and review_created webhooks from Hostex. These automatically keep your data in sync without manual refresh.',
    tags: ['webhooks', 'sync'],
  },
]

const guides: GuideItem[] = [
  {
    title: 'Getting Started',
    description: 'Connect your accounts and configure your first property',
    icon: Zap,
    link: '/settings/connections',
  },
  {
    title: 'Managing Properties',
    description: 'View, edit, and organize your property portfolio',
    icon: BookOpen,
    link: '/properties',
  },
  {
    title: 'Pricing Optimization',
    description: 'Set up rules and seasonal strategies for dynamic pricing',
    icon: Settings,
    link: '/pricing/rules',
  },
  {
    title: 'Guest Communication',
    description: 'Handle conversations and set up AI-powered concierge',
    icon: MessageCircle,
    link: '/chats',
  },
  {
    title: 'Task Management',
    description: 'Track maintenance, cleaning, and inspection tasks',
    icon: LifeBuoy,
    link: '/tasks',
  },
  {
    title: 'Team Management',
    description: 'Invite team members and manage roles and permissions',
    icon: HelpCircle,
    link: '/users',
  },
]

// ---- Component ----

function FaqAccordion({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className='flex w-full items-center justify-between rounded-lg p-4 text-left hover:bg-muted/50 transition-colors'>
        <span className='font-medium text-sm'>{item.question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className='px-4 pb-4'>
          <p className='text-sm text-muted-foreground leading-relaxed'>
            {item.answer}
          </p>
          <div className='mt-2 flex gap-1'>
            {item.tags.map((tag) => (
              <Badge key={tag} variant='secondary' className='text-xs'>
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function HelpCenter() {
  const [search, setSearch] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const filteredFaqs = search
    ? faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(search.toLowerCase()) ||
          faq.answer.toLowerCase().includes(search.toLowerCase()) ||
          faq.tags.some((t) => t.includes(search.toLowerCase()))
      )
    : faqs

  return (
    <>
      <Header>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mx-auto max-w-4xl'>
          {/* Hero */}
          <div className='mb-8 text-center'>
            <h1 className='text-3xl font-bold tracking-tight'>Help Center</h1>
            <p className='mt-2 text-muted-foreground'>
              Find answers to common questions and get started with HostGrowth
            </p>
            <div className='relative mx-auto mt-6 max-w-md'>
              <SearchIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search for help...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-9'
              />
            </div>
          </div>

          {/* Quick Start Guides */}
          {!search && (
            <>
              <h2 className='mb-4 text-lg font-semibold'>Quick Start Guides</h2>
              <div className='mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {guides.map((guide) => (
                  <Card
                    key={guide.title}
                    className='transition-colors hover:bg-muted/30'
                  >
                    <Link to={guide.link}>
                      <CardHeader className='pb-2'>
                        <div className='flex items-center gap-2'>
                          <guide.icon className='h-5 w-5 text-primary' />
                          <CardTitle className='text-sm'>{guide.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{guide.description}</CardDescription>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
              <Separator className='mb-8' />
            </>
          )}

          {/* FAQ Section */}
          <h2 className='mb-4 text-lg font-semibold'>
            Frequently Asked Questions
            {search && (
              <span className='ml-2 text-sm font-normal text-muted-foreground'>
                ({filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''})
              </span>
            )}
          </h2>
          <Card>
            <CardContent className='p-0 divide-y'>
              {filteredFaqs.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-10'>
                  <HelpCircle className='h-10 w-10 text-muted-foreground/50' />
                  <p className='mt-2 text-sm text-muted-foreground'>
                    No results found for &ldquo;{search}&rdquo;
                  </p>
                </div>
              ) : (
                filteredFaqs.map((faq, idx) => (
                  <FaqAccordion
                    key={idx}
                    item={faq}
                    isOpen={openFaq === idx}
                    onToggle={() =>
                      setOpenFaq(openFaq === idx ? null : idx)
                    }
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Contact Section */}
          {!search && (
            <Card className='mt-8'>
              <CardHeader>
                <CardTitle className='text-sm'>Still need help?</CardTitle>
                <CardDescription>
                  Can&apos;t find what you&apos;re looking for? Reach out directly.
                </CardDescription>
              </CardHeader>
              <CardContent className='flex gap-3'>
                <Button variant='outline' size='sm' asChild>
                  <a
                    href='mailto:support@hostgrowth.io'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <ExternalLink className='mr-1 h-3.5 w-3.5' />
                    Email Support
                  </a>
                </Button>
                <Button variant='outline' size='sm' asChild>
                  <Link to='/chats'>
                    <MessageCircle className='mr-1 h-3.5 w-3.5' />
                    Open Chat
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </Main>
    </>
  )
}
