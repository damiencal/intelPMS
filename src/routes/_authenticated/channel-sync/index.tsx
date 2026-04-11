import { createFileRoute } from '@tanstack/react-router'
import ChannelSyncPage from '@/features/channel-sync'

export const Route = createFileRoute('/_authenticated/channel-sync/')({
  component: ChannelSyncPage,
})
