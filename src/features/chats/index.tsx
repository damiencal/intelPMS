import { useState, useRef, useEffect } from 'react'
import { Fragment } from 'react/jsx-runtime'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  MoreVertical,
  Search as SearchIcon,
  Send,
  MessagesSquare,
  Loader2,
  Building2,
  BotMessageSquare,
  MailPlus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Link } from '@tanstack/react-router'

// ---- Types ----

interface Conversation {
  id: string
  hostexId: string
  guestName: string | null
  channel: string | null
  lastMessageAt: string | null
  unreadCount: number
  property: { id: string; name: string }
  messages: { content: string; sender: string; sentAt: string }[]
}

interface ConversationsResponse {
  data: Conversation[]
  meta: { total: number }
}

interface Message {
  id: string
  conversationId: string
  sender: string
  content: string
  messageType: string
  sentAt: string
}

interface MessagesResponse {
  data: Message[]
  meta: { total: number }
}

// ---- Hooks ----

function useConversations(search?: string) {
  const params = new URLSearchParams({ per_page: '100' })
  if (search) params.set('search', search)
  return useQuery({
    queryKey: ['conversations', search],
    queryFn: () => api.get<ConversationsResponse>(`/conversations?${params}`),
    select: (data) => data.data,
    refetchInterval: 15000, // poll for new messages every 15s
  })
}

function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['conversations', conversationId, 'messages'],
    queryFn: () => api.get<MessagesResponse>(`/conversations/${conversationId}/messages?per_page=100`),
    select: (data) => data.data,
    enabled: !!conversationId,
    refetchInterval: 10000,
  })
}

function useSendMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      api.post(`/conversations/${conversationId}/messages`, { content }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', variables.conversationId, 'messages'] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

function getInitials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function groupMessagesByDate(messages: Message[]): Record<string, Message[]> {
  return messages.reduce((acc: Record<string, Message[]>, msg) => {
    const key = format(new Date(msg.sentAt), 'd MMM, yyyy')
    if (!acc[key]) acc[key] = []
    acc[key].push(msg)
    return acc
  }, {})
}

export function Chats() {
  const [search, setSearch] = useState('')
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null)
  const [mobileSelectedConvo, setMobileSelectedConvo] = useState<Conversation | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: conversations, isLoading } = useConversations(search || undefined)
  const { data: messages } = useMessages(selectedConvo?.id ?? null)
  const sendMessage = useSendMessage()

  const groupedMessages = messages ? groupMessagesByDate(messages) : {}

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedConvo || !messageInput.trim()) return
    sendMessage.mutate(
      { conversationId: selectedConvo.id, content: messageInput.trim() },
      { onSuccess: () => setMessageInput('') }
    )
  }

  return (
    <>
      <Header>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <section className='flex h-full gap-6'>
          {/* Left Side — Conversation List */}
          <div className='flex w-full flex-col gap-2 sm:w-56 lg:w-72 2xl:w-80'>
            <div className='sticky top-0 z-10 -mx-4 bg-background px-4 pb-3 shadow-md sm:static sm:z-auto sm:mx-0 sm:p-0 sm:shadow-none'>
              <div className='flex items-center justify-between py-2'>
                <div className='flex gap-2'>
                  <h1 className='text-2xl font-bold'>Messages</h1>
                  <MessagesSquare size={20} />
                </div>
                <div className='flex items-center gap-1'>
                  <Link to='/messaging'>
                    <Button variant='ghost' size='icon' className='h-8 w-8' title='Message Templates'>
                      <MailPlus size={16} />
                    </Button>
                  </Link>
                  <Link to='/auto-messages'>
                    <Button variant='ghost' size='icon' className='h-8 w-8' title='Auto Messages'>
                      <BotMessageSquare size={16} />
                    </Button>
                  </Link>
                </div>
              </div>

              <label
                className={cn(
                  'focus-within:ring-1 focus-within:ring-ring focus-within:outline-hidden',
                  'flex h-10 w-full items-center space-x-0 rounded-md border border-border ps-2'
                )}
              >
                <SearchIcon size={15} className='me-2 stroke-slate-500' />
                <span className='sr-only'>Search</span>
                <input
                  type='text'
                  className='w-full flex-1 bg-inherit text-sm focus-visible:outline-hidden'
                  placeholder='Search guests...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>

            {isLoading ? (
              <div className='flex items-center justify-center py-10'>
                <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
              </div>
            ) : !conversations || conversations.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-10 text-center'>
                <MessagesSquare className='h-8 w-8 text-muted-foreground/50' />
                <p className='mt-2 text-sm text-muted-foreground'>
                  {search ? 'No matching conversations' : 'No guest conversations yet'}
                </p>
                {!search && (
                  <Button variant='outline' size='sm' className='mt-2' asChild>
                    <Link to='/settings/connections'>Sync from Hostex</Link>
                  </Button>
                )}
              </div>
            ) : (
              <ScrollArea className='-mx-3 h-full overflow-scroll p-3'>
                {conversations.map((convo) => {
                  const lastMsg = convo.messages[0]
                  const lastMsgText = lastMsg
                    ? lastMsg.sender === 'host'
                      ? `You: ${lastMsg.content}`
                      : lastMsg.content
                    : 'No messages'

                  return (
                    <Fragment key={convo.id}>
                      <button
                        type='button'
                        className={cn(
                          'group hover:bg-accent hover:text-accent-foreground',
                          'flex w-full rounded-md px-2 py-2 text-start text-sm',
                          selectedConvo?.id === convo.id && 'sm:bg-muted'
                        )}
                        onClick={() => {
                          setSelectedConvo(convo)
                          setMobileSelectedConvo(convo)
                        }}
                      >
                        <div className='flex gap-2'>
                          <Avatar>
                            <AvatarFallback>{getInitials(convo.guestName)}</AvatarFallback>
                          </Avatar>
                          <div className='flex-1 overflow-hidden'>
                            <div className='flex items-center gap-2'>
                              <span className='font-medium'>
                                {convo.guestName || 'Guest'}
                              </span>
                              {convo.unreadCount > 0 && (
                                <Badge variant='default' className='h-5 min-w-5 justify-center rounded-full px-1.5 text-xs'>
                                  {convo.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <span className='line-clamp-1 text-ellipsis text-muted-foreground group-hover:text-accent-foreground/90'>
                              {lastMsgText}
                            </span>
                            <span className='text-xs text-muted-foreground'>
                              {convo.property.name}
                              {convo.channel && ` · ${convo.channel}`}
                            </span>
                          </div>
                        </div>
                      </button>
                      <Separator className='my-1' />
                    </Fragment>
                  )
                })}
              </ScrollArea>
            )}
          </div>

          {/* Right Side — Message Thread */}
          {selectedConvo ? (
            <div
              className={cn(
                'absolute inset-0 start-full z-50 hidden w-full flex-1 flex-col border bg-background shadow-xs sm:static sm:z-auto sm:flex sm:rounded-md',
                mobileSelectedConvo && 'start-0 flex'
              )}
            >
              {/* Header */}
              <div className='mb-1 flex flex-none justify-between bg-card p-4 shadow-lg sm:rounded-t-md'>
                <div className='flex gap-3'>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='-ms-2 h-full sm:hidden'
                    onClick={() => setMobileSelectedConvo(null)}
                  >
                    <ArrowLeft className='rtl:rotate-180' />
                  </Button>
                  <div className='flex items-center gap-2 lg:gap-4'>
                    <Avatar className='size-9 lg:size-11'>
                      <AvatarFallback>{getInitials(selectedConvo.guestName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <span className='col-start-2 row-span-2 text-sm font-medium lg:text-base'>
                        {selectedConvo.guestName || 'Guest'}
                      </span>
                      <span className='col-start-2 row-span-2 row-start-2 line-clamp-1 block max-w-32 text-xs text-nowrap text-ellipsis text-muted-foreground lg:max-w-none lg:text-sm'>
                        <Building2 className='mr-1 inline h-3 w-3' />
                        {selectedConvo.property.name}
                        {selectedConvo.channel && ` · ${selectedConvo.channel}`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className='-me-1 flex items-center gap-1 lg:gap-2'>
                  <Button size='icon' variant='ghost' className='h-10 rounded-md sm:h-8 sm:w-4 lg:h-10 lg:w-6'>
                    <MoreVertical className='stroke-muted-foreground sm:size-5' />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className='flex flex-1 flex-col gap-2 rounded-md px-4 pt-0 pb-4'>
                <div className='flex size-full flex-1'>
                  <div className='chat-text-container relative -me-4 flex flex-1 flex-col overflow-y-hidden'>
                    <div className='chat-flex flex h-40 w-full grow flex-col-reverse justify-start gap-4 overflow-y-auto py-2 pe-4 pb-4'>
                      <div ref={messagesEndRef} />
                      {Object.keys(groupedMessages)
                        .reverse()
                        .map((dateKey) => (
                          <Fragment key={dateKey}>
                            {groupedMessages[dateKey]
                              .slice()
                              .reverse()
                              .map((msg) => (
                                <div
                                  key={msg.id}
                                  className={cn(
                                    'chat-box max-w-72 px-3 py-2 wrap-break-word shadow-lg',
                                    msg.sender === 'host'
                                      ? 'self-end rounded-[16px_16px_0_16px] bg-primary/90 text-primary-foreground/75'
                                      : 'self-start rounded-[16px_16px_16px_0] bg-muted'
                                  )}
                                >
                                  {msg.content}
                                  <span
                                    className={cn(
                                      'mt-1 block text-xs font-light text-foreground/75 italic',
                                      msg.sender === 'host' && 'text-end text-primary-foreground/85'
                                    )}
                                  >
                                    {format(new Date(msg.sentAt), 'h:mm a')}
                                  </span>
                                </div>
                              ))}
                            <div className='text-center text-xs'>{dateKey}</div>
                          </Fragment>
                        ))}
                    </div>
                  </div>
                </div>
                <form onSubmit={handleSend} className='flex w-full flex-none gap-2'>
                  <div className='flex flex-1 items-center gap-2 rounded-md border border-input bg-card px-2 py-1 focus-within:ring-1 focus-within:ring-ring focus-within:outline-hidden lg:gap-4'>
                    <label className='flex-1'>
                      <span className='sr-only'>Chat Text Box</span>
                      <input
                        type='text'
                        placeholder='Type your message...'
                        className='h-8 w-full bg-inherit focus-visible:outline-hidden'
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                      />
                    </label>
                    <Button
                      type='submit'
                      variant='ghost'
                      size='icon'
                      disabled={sendMessage.isPending || !messageInput.trim()}
                    >
                      {sendMessage.isPending ? (
                        <Loader2 size={20} className='animate-spin' />
                      ) : (
                        <Send size={20} />
                      )}
                    </Button>
                  </div>
                  <Button type='submit' className='h-full sm:hidden' disabled={sendMessage.isPending || !messageInput.trim()}>
                    <Send size={18} /> Send
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                'absolute inset-0 start-full z-50 hidden w-full flex-1 flex-col justify-center rounded-md border bg-card shadow-xs sm:static sm:z-auto sm:flex'
              )}
            >
              <div className='flex flex-col items-center space-y-6'>
                <div className='flex size-16 items-center justify-center rounded-full border-2 border-border'>
                  <MessagesSquare className='size-8' />
                </div>
                <div className='space-y-2 text-center'>
                  <h1 className='text-xl font-semibold'>Guest Messages</h1>
                  <p className='text-sm text-muted-foreground'>
                    Select a conversation to view and reply to guest messages.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </Main>
    </>
  )
}
