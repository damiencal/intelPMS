import { registerJobHandler } from '../job-queue'
import { prisma } from '../prisma'
import { initialSync } from '../sync/initial-sync'
import { channexInitialSync, upsertChannexBookingFromRevision } from '../sync/channex-sync'
import { ChannexClient } from '../channex/client'
import type { ChannexBookingRevisionAttributes } from '../channex/types'

// ---- Helpers for individual webhook event types ----

async function handleReservationEvent(
  data: Record<string, unknown>,
  connectionId: string
) {
  const res = data as Record<string, unknown>
  const propHostexId = String(res.property_id ?? '')
  if (!propHostexId) return

  const property = await prisma.property.findUnique({
    where: { hostexId: propHostexId },
  })
  if (!property) {
    console.warn(`[Webhook] Property not found for hostexId=${propHostexId}`)
    return
  }

  const reservationCode = String(res.reservation_code ?? res.id ?? '')
  if (!reservationCode) return

  const totalPrice =
    (res.rates as Record<string, Record<string, unknown>> | undefined)?.total_rate?.amount as number | undefined

  await prisma.reservation.upsert({
    where: { hostexId: reservationCode },
    create: {
      hostexId: reservationCode,
      propertyId: property.id,
      channel: String(res.channel_type ?? ''),
      guestName: (res.guest_name as string) || null,
      guestEmail: (res.guest_email as string) || undefined,
      guestPhone: (res.guest_phone as string) || undefined,
      checkIn: new Date(res.check_in_date as string),
      checkOut: new Date(res.check_out_date as string),
      status: String(res.status ?? 'confirmed'),
      totalPrice,
      currency: ((res.rates as Record<string, Record<string, unknown>> | undefined)?.total_rate?.currency as string) || 'USD',
      numGuests: (res.number_of_guests as number) || undefined,
      confirmationCode: reservationCode,
      source: String(res.channel_type ?? ''),
      metadata: res as object,
    },
    update: {
      channel: String(res.channel_type ?? ''),
      guestName: (res.guest_name as string) || null,
      status: String(res.status ?? 'confirmed'),
      totalPrice,
      metadata: res as object,
    },
  })

  console.log(`[Webhook] Upserted reservation ${reservationCode} for property ${property.name}`)
}

async function handleCalendarEvent(
  data: Record<string, unknown>,
  _connectionId: string
) {
  // Calendar updates contain listing_id + date range
  const listingHostexId = String(data.listing_id ?? '')
  if (!listingHostexId) return

  const listing = await prisma.listing.findUnique({
    where: { hostexId: listingHostexId },
  })
  if (!listing) {
    console.warn(`[Webhook] Listing not found for hostexId=${listingHostexId}`)
    return
  }

  // If the payload contains calendar entries, upsert them
  const entries = (data.calendars ?? data.entries ?? []) as Array<Record<string, unknown>>
  let synced = 0
  for (const entry of entries) {
    const date = entry.date as string | undefined
    if (!date) continue

    await prisma.calendarEntry.upsert({
      where: {
        listingId_date: {
          listingId: listing.id,
          date: new Date(date),
        },
      },
      create: {
        listingId: listing.id,
        date: new Date(date),
        price: (entry.price as number) ?? undefined,
        available: (entry.available as boolean) ?? true,
        minStay: (entry.min_stay as number) ?? undefined,
      },
      update: {
        price: (entry.price as number) ?? undefined,
        available: (entry.available as boolean) ?? true,
        minStay: (entry.min_stay as number) ?? undefined,
      },
    })
    synced++
  }

  console.log(`[Webhook] Synced ${synced} calendar entries for listing ${listing.id}`)
}

async function handleMessageEvent(
  data: Record<string, unknown>,
  _connectionId: string
) {
  // The payload typically includes the conversation ID and message details
  const conversationHostexId = String(data.conversation_id ?? '')
  if (!conversationHostexId) return

  const conversation = await prisma.conversation.findFirst({
    where: { hostexId: conversationHostexId },
  })

  if (!conversation) {
    // New conversation we haven't seen — create it
    const propHostexId = String(data.property_id ?? '')
    const property = propHostexId
      ? await prisma.property.findUnique({ where: { hostexId: propHostexId } })
      : null

    if (!property) {
      console.warn(`[Webhook] Cannot find property for new conversation ${conversationHostexId}`)
      return
    }

    const newConvo = await prisma.conversation.create({
      data: {
        hostexId: conversationHostexId,
        propertyId: property.id,
        guestName: (data.guest_name as string) || null,
        channel: (data.channel_type as string) || null,
        lastMessageAt: new Date(),
      },
    })

    await prisma.message.create({
      data: {
        conversationId: newConvo.id,
        sender: (data.sender as string) === 'host' ? 'host' : 'guest',
        content: String(data.content ?? data.message ?? ''),
        messageType: 'text',
        sentAt: data.sent_at ? new Date(data.sent_at as string) : new Date(),
      },
    })

    console.log(`[Webhook] Created new conversation ${newConvo.id} with first message`)
    return
  }

  // Add message to existing conversation
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      sender: (data.sender as string) === 'host' ? 'host' : 'guest',
      content: String(data.content ?? data.message ?? ''),
      messageType: 'text',
      sentAt: data.sent_at ? new Date(data.sent_at as string) : new Date(),
    },
  })

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  })

  console.log(`[Webhook] Added message to conversation ${conversation.id}`)
}

async function handleReviewEvent(
  data: Record<string, unknown>,
  _connectionId: string
) {
  const propHostexId = String(data.property_id ?? '')
  const property = propHostexId
    ? await prisma.property.findUnique({ where: { hostexId: propHostexId } })
    : null
  if (!property) {
    console.warn(`[Webhook] Property not found for review, hostexId=${propHostexId}`)
    return
  }

  const reservationCode = String(data.reservation_code ?? '')
  const reviewHostexId = `review-${reservationCode || Date.now()}`

  const guestReview = data.guest_review as Record<string, unknown> | undefined
  const rating = (guestReview?.score as number) ?? (data.rating as number) ?? undefined
  const content = (guestReview?.content as string) ?? (data.content as string) ?? ''

  await prisma.review.upsert({
    where: { hostexId: reviewHostexId },
    create: {
      hostexId: reviewHostexId,
      propertyId: property.id,
      reservationCode: reservationCode || undefined,
      channel: (data.channel_type as string) || null,
      guestName: (data.guest_name as string) || null,
      rating,
      content,
      reviewDate: data.created_at ? new Date(data.created_at as string) : new Date(),
      sentiment: 'neutral',
      responseStatus: 'needs_response',
      metadata: data as object,
    },
    update: {
      rating,
      content,
      metadata: data as object,
    },
  })

  console.log(`[Webhook] Upserted review ${reviewHostexId} for property ${property.name}`)
}

// ---- Register all handlers ----

/**
 * Register all job handlers for the different queues
 */
export function registerAllJobHandlers(): void {
  // Sync jobs
  registerJobHandler('sync', async (payload) => {
    const { type, connectionId, organizationId } = payload as {
      type: string
      connectionId: string
      organizationId: string
    }

    switch (type) {
      case 'initial_sync':
      case 'full_sync':
        await initialSync(connectionId, organizationId)
        break
      default:
        console.warn(`[Jobs] Unknown sync job type: ${type}`)
    }
  })

  // Webhook event processing
  registerJobHandler('webhook', async (payload) => {
    const { event, data, connectionId, organizationId } = payload as {
      event: string
      data: Record<string, unknown>
      connectionId: string
      organizationId: string
    }

    console.log(`[Jobs] Processing webhook event: ${event} for connection ${connectionId}`)

    try {
      switch (event) {
        case 'reservation_created':
        case 'reservation_updated':
          await handleReservationEvent(data, connectionId)
          break

        case 'property_availability_updated':
        case 'listing_calendar_updated':
          await handleCalendarEvent(data, connectionId)
          break

        case 'message_created':
          await handleMessageEvent(data, connectionId)
          break

        case 'review_created':
          await handleReviewEvent(data, connectionId)
          break

        default:
          console.warn(`[Jobs] Unknown webhook event: ${event}`)
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          organizationId,
          type: `webhook_${event}`,
          description: `Processed webhook event: ${event}`,
          metadata: { event, connectionId },
        },
      })
    } catch (err) {
      console.error(`[Jobs] Error processing webhook event ${event}:`, err)
      await prisma.activityLog.create({
        data: {
          organizationId,
          type: `webhook_error`,
          description: `Failed to process webhook event: ${event} — ${err instanceof Error ? err.message : String(err)}`,
          metadata: { event, connectionId, error: String(err) },
        },
      })
    }
  })

  // Pricing jobs
  registerJobHandler('pricing', async (payload) => {
    console.log(`[Jobs] Processing pricing job:`, payload)
    // Pricing engine jobs will be implemented in Phase 3
  })

  // Email jobs
  registerJobHandler('email', async (payload) => {
    console.log(`[Jobs] Processing email job:`, payload)
    // Email sending will be implemented in Phase 5
  })

  // Channex sync jobs
  registerJobHandler('channex_sync', async (payload) => {
    const { type, connectionId, organizationId } = payload as {
      type: string
      connectionId: string
      organizationId: string
    }

    switch (type) {
      case 'initial_sync':
      case 'full_sync':
        await channexInitialSync(connectionId, organizationId)
        break
      default:
        console.warn(`[Jobs] Unknown channex_sync job type: ${type}`)
    }
  })

  // Channex webhook event processing
  registerJobHandler('channex_webhook', async (payload) => {
    const { event, data, channexPropertyId, connectionId, organizationId } = payload as {
      event: string
      data: unknown
      channexPropertyId: string
      connectionId: string
      organizationId: string
    }

    console.log(`[Jobs] Processing Channex webhook event: ${event} (property ${channexPropertyId})`)

    try {
      switch (event) {
        case 'booking_new':
        case 'booking_modification':
        case 'booking_cancellation':
        case 'booking': {
          // The webhook may contain full revision data (send_data=true)
          // or just identifiers (send_data=false). Pull from API if needed.
          const bookingData = data as Record<string, unknown> | null

          if (
            bookingData &&
            bookingData.booking_id &&
            bookingData.rooms
          ) {
            // Full data provided — upsert directly
            await upsertChannexBookingFromRevision(
              bookingData as unknown as ChannexBookingRevisionAttributes,
              organizationId
            )
            // Ack the revision
            const revisionId = String(bookingData.revision_id || '')
            if (revisionId) {
              const client = new ChannexClient(connectionId)
              await client.acknowledgeBookingRevision(revisionId).catch(() => {})
            }
          } else if (bookingData?.booking_id) {
            // Only IDs provided — pull from API, ack, and upsert
            const client = new ChannexClient(connectionId)
            const revisionId = String(bookingData.revision_id || '')
            if (revisionId) {
              const res = await client.getBookingRevision(revisionId)
              await upsertChannexBookingFromRevision(
                res.data.attributes as unknown as ChannexBookingRevisionAttributes,
                organizationId
              )
              await client.acknowledgeBookingRevision(revisionId).catch(() => {})
            }
          } else {
            // No usable data — pull the feed for this property to pick up missed bookings
            const client = new ChannexClient(connectionId)
            await pullFeedForProperty(client, channexPropertyId, organizationId)
          }

          await prisma.activityLog.create({
            data: {
              organizationId,
              type: `channex_booking_${event.replace('booking_', '')}`,
              description: `Channex booking event received: ${event}`,
              metadata: { event, channexPropertyId },
            },
          })
          break
        }

        case 'ari': {
          // ARI change — use as a trigger to log, not to update our DB
          // (we pull ARI from Channex on-demand; we push ARI to Channex)
          console.log(`[ChannexWebhook] ARI change for property ${channexPropertyId}`)
          break
        }

        default:
          console.log(`[Jobs] Unhandled Channex event: ${event}`)
      }
    } catch (err) {
      console.error(`[Jobs] Error processing Channex webhook event ${event}:`, err)
      await prisma.activityLog.create({
        data: {
          organizationId,
          type: 'channex_webhook_error',
          description: `Failed to process Channex event: ${event} — ${err instanceof Error ? err.message : String(err)}`,
          metadata: { event, channexPropertyId, error: String(err) },
        },
      })
    }
  })
}

/** Pull the booking revisions feed for a specific property and ack. */
async function pullFeedForProperty(
  client: ChannexClient,
  channexPropertyId: string,
  organizationId: string
): Promise<void> {
  const feed = await client.getBookingRevisionsFeed({
    'filter[property_id]': channexPropertyId,
    'order[inserted_at]': 'asc',
  })

  for (const rev of feed.data ?? []) {
    const attr = rev.attributes as ChannexBookingRevisionAttributes
    await upsertChannexBookingFromRevision(attr, organizationId)
    const revId = attr.revision_id || rev.id
    await client.acknowledgeBookingRevision(revId).catch(() => {})
  }
}
