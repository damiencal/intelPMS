import { useState } from 'react'
import {
  Clock,
  Loader2,
  MailPlus,
  MessageSquareText,
  MoreHorizontal,
  Pencil,
  Power,
  PowerOff,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfigDrawer } from '@/components/config-drawer'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import type { MessageTemplate } from './api'
import {
  TRIGGER_OPTIONS,
  CHANNEL_OPTIONS,
  useMessageTemplates,
  useDeleteTemplate,
  useToggleTemplate,
} from './api'
import { TemplateDialog } from './components/template-dialog'

function getTriggerLabel(trigger: string) {
  return TRIGGER_OPTIONS.find((t) => t.value === trigger)?.label ?? trigger
}
function getChannelLabel(channel: string) {
  return CHANNEL_OPTIONS.find((c) => c.value === channel)?.label ?? channel
}
function formatDelay(minutes: number) {
  if (minutes === 0) return 'Immediate'
  if (minutes < 60) return `${minutes}m delay`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m delay` : `${h}h delay`
}

export function MessagingTemplates() {
  const { data: templates, isLoading } = useMessageTemplates()
  const deleteMutation = useDeleteTemplate()
  const toggleMutation = useToggleTemplate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MessageTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MessageTemplate | null>(null)

  function handleCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function handleEdit(template: MessageTemplate) {
    setEditing(template)
    setDialogOpen(true)
  }

  async function handleToggle(template: MessageTemplate) {
    try {
      await toggleMutation.mutateAsync({
        id: template.id,
        enabled: !template.enabled,
      })
      toast.success(
        template.enabled ? 'Template disabled' : 'Template enabled'
      )
    } catch {
      toast.error('Failed to update template')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success('Template deleted')
    } catch {
      toast.error('Failed to delete template')
    } finally {
      setDeleteTarget(null)
    }
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

      <Main>
        <div className='mb-2 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              Messaging Templates
            </h1>
            <p className='text-muted-foreground'>
              Automate guest communications with template messages
            </p>
          </div>
          <Button onClick={handleCreate}>
            <MailPlus className='mr-2 h-4 w-4' />
            New Template
          </Button>
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center py-20'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : !templates?.length ? (
          <Card className='py-16'>
            <CardContent className='flex flex-col items-center text-center'>
              <MessageSquareText className='mb-4 h-12 w-12 text-muted-foreground' />
              <h2 className='text-xl font-semibold'>No templates yet</h2>
              <p className='mt-2 max-w-md text-muted-foreground'>
                Create message templates to automatically send messages to
                guests when bookings are confirmed, before check-in, or after
                check-out.
              </p>
              <Button className='mt-6' onClick={handleCreate}>
                <MailPlus className='mr-2 h-4 w-4' />
                Create Your First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {templates.map((template) => (
              <Card
                key={template.id}
                className={template.enabled ? '' : 'opacity-60'}
              >
                <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-3'>
                  <div className='space-y-1'>
                    <CardTitle className='text-base'>
                      {template.name}
                    </CardTitle>
                    <CardDescription className='flex flex-wrap items-center gap-2'>
                      <Badge variant='outline'>
                        {getTriggerLabel(template.trigger)}
                      </Badge>
                      <Badge variant='secondary'>
                        {getChannelLabel(template.channel)}
                      </Badge>
                      {!template.enabled && (
                        <Badge variant='destructive'>Disabled</Badge>
                      )}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='icon' className='h-8 w-8'>
                        <MoreHorizontal className='h-4 w-4' />
                        <span className='sr-only'>Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onClick={() => handleEdit(template)}>
                        <Pencil className='mr-2 h-4 w-4' />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggle(template)}>
                        {template.enabled ? (
                          <>
                            <PowerOff className='mr-2 h-4 w-4' />
                            Disable
                          </>
                        ) : (
                          <>
                            <Power className='mr-2 h-4 w-4' />
                            Enable
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className='text-destructive focus:text-destructive'
                        onClick={() => setDeleteTarget(template)}
                      >
                        <Trash2 className='mr-2 h-4 w-4' />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <p className='line-clamp-3 text-sm text-muted-foreground'>
                    {template.body}
                  </p>
                  <div className='mt-3 flex items-center gap-1 text-xs text-muted-foreground'>
                    <Clock className='h-3 w-3' />
                    {formatDelay(template.delayMinutes)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Main>

      <TemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title='Delete Template'
        desc={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        handleConfirm={handleDelete}
        confirmText='Delete'
        destructive
      />
    </>
  )
}
