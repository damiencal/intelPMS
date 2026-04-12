import { ChannexClient } from '../channex/client'
import { prisma } from '../prisma'
import { encrypt } from '../encryption'
import type { ChannexBookingRevisionAttributes } from '../channex/types'

/**
 * Full initial sync for a Channex connection:
 * Properties → Room Types → Rate Plans → Bookings (feed)
 * Also sets up a global webhook if APP_URL is configured.
 */
export async function channexInitialSync(
  connectionId: string,
  organizationId: string
): Promise<void> {
  console.log(`[ChannexSync] Starting initial sync for connection ${connectionId}`)

  const client = new ChannexClient(connectionId)

  await prisma.channexConnection.update({
    where: { id: connectionId },
    data: { syncStatus: 'syncing', syncError: null },
  })

  try {
    // 1. Register a global webhook (receives all events for all properties)
    await ensureGlobalWebhook(client, connectionId)

    // 2. Sync properties
    console.log(`[ChannexSync] Fetching properties...`)
    const allProperties = await fetchAllPages(async (page) =>
      client.getProperties({ 'pagination[page]': page, 'pagination[limit]': 100 })
    )
    console.log(`[ChannexSync] Found ${allProperties.length} properties`)

    for (const propResource of allProperties) {
      const attr = propResource.attributes
      const channexId = propResource.id

      const property = await prisma.channexProperty.upsert({
        where: { channexId },
        create: {
          channexId,
          connectionId,
          organizationId,
          name: attr.title,
          currency: attr.currency || 'USD',
          timezone: attr.timezone || 'UTC',
          address: attr.address || null,
          country: attr.country || null,
          email: attr.email || null,
          phone: attr.phone || null,
          metadata: propResource as object,
        },
        update: {
          name: attr.title,
          currency: attr.currency || 'USD',
          timezone: attr.timezone || 'UTC',
          address: attr.address || null,
          country: attr.country || null,
          email: attr.email || null,
          phone: attr.phone || null,
          metadata: propResource as object,
        },
      })

      // 3. Sync room types for this property
      const allRoomTypes = await fetchAllPages(async (page) =>
        client.getRoomTypes({
          'pagination[page]': page,
          'pagination[limit]': 100,
          'filter[property_id]': channexId,
        })
      )

      for (const rtResource of allRoomTypes) {
        await prisma.channexRoomType.upsert({
          where: { channexId: rtResource.id },
          create: {
            channexId: rtResource.id,
            propertyId: property.id,
            name: rtResource.attributes.title,
            maxGuests: rtResource.attributes.max_occupancy ?? rtResource.attributes.occupancy ?? null,
            metadata: rtResource as object,
          },
          update: {
            name: rtResource.attributes.title,
            maxGuests: rtResource.attributes.max_occupancy ?? rtResource.attributes.occupancy ?? null,
            metadata: rtResource as object,
          },
        })
      }

      // 4. Sync rate plans for this property
      const allRatePlans = await fetchAllPages(async (page) =>
        client.getRatePlans({
          'pagination[page]': page,
          'pagination[limit]': 100,
          'filter[property_id]': channexId,
        })
      )

      for (const rpResource of allRatePlans) {
        const rpAttr = rpResource.attributes
        const roomTypeId = rpAttr.room_type_id

        // Find the local room type
        const localRoomType = await prisma.channexRoomType.findUnique({
          where: { channexId: roomTypeId },
        })
        if (!localRoomType) {
          console.warn(
            `[ChannexSync] Rate plan ${rpResource.id} references unknown room type ${roomTypeId}`
          )
          continue
        }

        await prisma.channexRatePlan.upsert({
          where: { channexId: rpResource.id },
          create: {
            channexId: rpResource.id,
            propertyId: property.id,
            roomTypeId: localRoomType.id,
            name: rpAttr.title,
            currency: rpAttr.currency || property.currency,
            ratePlanCategory: rpAttr.rate_plan_category || null,
            sellMode: rpAttr.sell_mode || null,
            metadata: rpResource as object,
          },
          update: {
            name: rpAttr.title,
            currency: rpAttr.currency || property.currency,
            ratePlanCategory: rpAttr.rate_plan_category || null,
            sellMode: rpAttr.sell_mode || null,
            metadata: rpResource as object,
          },
        })
      }
    }

    // 5. Pull all unacknowledged bookings from the feed
    await pullAndAckBookingsFeed(client, organizationId)

    await prisma.channexConnection.update({
      where: { id: connectionId },
      data: {
        syncStatus: 'completed',
        lastSyncAt: new Date(),
        syncError: null,
      },
    })

    console.log(`[ChannexSync] Initial sync completed for connection ${connectionId}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[ChannexSync] Sync failed for connection ${connectionId}: ${message}`)
    await prisma.channexConnection.update({
      where: { id: connectionId },
      data: { syncStatus: 'failed', syncError: message },
    })
    throw error
  }
}

/**
 * Pull the unacknowledged booking revisions feed and upsert them into ChannexBooking.
 * Acknowledges each revision after storing.
 */
export async function pullAndAckBookingsFeed(
  client: ChannexClient,
  organizationId: string
): Promise<void> {
  console.log(`[ChannexSync] Pulling booking revisions feed...`)
  let page = 1
  let hasMore = true

  while (hasMore) {
    const res = await client.getBookingRevisionsFeed({
      'order[inserted_at]': 'asc',
    })

    const revisions = res.data ?? []
    if (revisions.length === 0) {
      hasMore = false
      break
    }

    for (const rev of revisions) {
      const attr = rev.attributes as ChannexBookingRevisionAttributes
      await upsertChannexBookingFromRevision(attr, organizationId)

      // Acknowledge so it won't appear in feed again
      try {
        await client.acknowledgeBookingRevision(attr.revision_id || rev.id)
      } catch (err) {
        console.warn(
          `[ChannexSync] Failed to ack revision ${attr.revision_id || rev.id}: ${err}`
        )
      }
    }

    // Channex feed doesn't paginate — it returns unacked revisions; once acked they disappear
    // If all were acked, next call returns empty
    hasMore = revisions.length > 0 && page < 20 // safety cap
    page++
  }

  console.log(`[ChannexSync] Booking feed pull complete`)
}

/**
 * Upsert a single booking revision into ChannexBooking.
 */
export async function upsertChannexBookingFromRevision(
  attr: ChannexBookingRevisionAttributes,
  organizationId: string
): Promise<void> {
  const channexPropertyId = attr.property_id
  const property = await prisma.channexProperty.findFirst({
    where: { channexId: channexPropertyId, organizationId },
  })
  if (!property) {
    console.warn(
      `[ChannexSync] Booking ${attr.booking_id} references unknown property ${channexPropertyId}`
    )
    return
  }

  const bookingId = attr.booking_id || attr.id
  const customer = attr.customer
  const guestName = [customer?.name, customer?.surname].filter(Boolean).join(' ') || null
  const amount = attr.amount ? parseFloat(attr.amount) : undefined

  const booking = await prisma.channexBooking.upsert({
    where: { channexId: bookingId },
    create: {
      channexId: bookingId,
      revisionId: attr.revision_id,
      propertyId: property.id,
      uniqueId: attr.unique_id || null,
      otaName: attr.ota_name || null,
      otaReservationCode: attr.ota_reservation_code || null,
      status: attr.status,
      arrivalDate: new Date(attr.arrival_date),
      departureDate: new Date(attr.departure_date),
      guestName,
      guestEmail: customer?.mail || null,
      guestPhone: customer?.phone || null,
      amount,
      currency: attr.currency || property.currency || 'USD',
      numAdults: attr.occupancy?.adults ?? 1,
      numChildren: attr.occupancy?.children ?? 0,
      notes: attr.notes || null,
      paymentCollect: attr.payment_collect || null,
      paymentType: attr.payment_type || null,
      acknowledged: true,
      metadata: attr as object,
    },
    update: {
      revisionId: attr.revision_id,
      status: attr.status,
      guestName,
      guestEmail: customer?.mail || null,
      amount,
      numAdults: attr.occupancy?.adults ?? 1,
      numChildren: attr.occupancy?.children ?? 0,
      notes: attr.notes || null,
      acknowledged: true,
      metadata: attr as object,
    },
  })

  // Upsert room records
  for (const room of attr.rooms ?? []) {
    const localRoomType = room.room_type_id
      ? await prisma.channexRoomType.findUnique({ where: { channexId: room.room_type_id } })
      : null
    const localRatePlan = room.rate_plan_id
      ? await prisma.channexRatePlan.findUnique({ where: { channexId: room.rate_plan_id } })
      : null

    const roomAmount = room.amount ? parseFloat(String(room.amount)) : undefined

    await prisma.channexBookingRoom.create({
      data: {
        bookingId: booking.id,
        roomTypeId: localRoomType?.id || null,
        ratePlanId: localRatePlan?.id || null,
        checkinDate: new Date(room.checkin_date),
        checkoutDate: new Date(room.checkout_date),
        amount: roomAmount,
        numAdults: room.occupancy?.adults ?? 1,
        numChildren: room.occupancy?.children ?? 0,
        days: (room.days as object) || null,
        metadata: room as object,
      },
    }).catch(() => {
      // Room may already exist from previous partial sync; ignore duplicate inserts
    })
  }
}

/**
 * Register a global webhook for all events if not already done.
 */
async function ensureGlobalWebhook(
  client: ChannexClient,
  connectionId: string
): Promise<void> {
  const appUrl = process.env.APP_URL
  if (!appUrl) {
    console.warn('[ChannexSync] APP_URL not set; skipping webhook registration')
    return
  }

  const connection = await prisma.channexConnection.findUniqueOrThrow({
    where: { id: connectionId },
  })

  // Skip if webhook already registered
  if (connection.webhookId) return

  const callbackUrl = `${appUrl}/api/webhooks/channex`

  try {
    const result = await client.createWebhook({
      callback_url: callbackUrl,
      event_mask: 'booking_new;booking_modification;booking_cancellation;ari',
      property_id: null,
      is_global: true,
      is_active: true,
      send_data: true,
    })

    const webhookId = result.data?.id
    if (webhookId) {
      await prisma.channexConnection.update({
        where: { id: connectionId },
        data: { webhookId },
      })
      console.log(`[ChannexSync] Registered global webhook ${webhookId}`)
    }
  } catch (err) {
    console.warn(`[ChannexSync] Failed to register webhook: ${err}`)
  }
}

/**
 * Helper: fetch all pages from a paginated Channex endpoint.
 */
async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<{ data: T[]; meta: { total: number; limit: number; page: number } }>
): Promise<T[]> {
  const results: T[] = []
  let page = 1

  while (true) {
    const res = await fetchPage(page)
    const items = res.data ?? []
    results.push(...items)

    const { total, limit } = res.meta ?? {}
    if (!total || results.length >= total || items.length === 0) break
    page++
  }

  return results
}

export { fetchAllPages }
