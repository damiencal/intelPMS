import { HostexClient } from '../hostex/client'
import { prisma } from '../prisma'

/**
 * Full initial sync for a connection:
 * Properties → Listings (from channels) → Room Types → Reservations → Reviews
 */
export async function initialSync(connectionId: string, organizationId: string): Promise<void> {
  console.log(`[Sync] Starting initial sync for connection ${connectionId}`)

  const client = new HostexClient(connectionId)

  try {
    await prisma.hostexConnection.update({
      where: { id: connectionId },
      data: { syncStatus: 'syncing', syncError: null },
    })

    // 1. Sync properties
    const propertiesRes = await client.getProperties({ per_page: 100 })
    const properties = propertiesRes?.data?.properties ?? []
    console.log(`[Sync] Fetched ${properties.length} properties from Hostex`)

    for (const prop of properties) {
      const hostexId = String(prop.id)

      await prisma.property.upsert({
        where: { hostexId },
        create: {
          hostexId,
          connectionId,
          organizationId,
          name: prop.title,
          address: prop.address,
          currency: prop.channels?.[0]?.currency || 'USD',
          timezone: prop.timezone || 'UTC',
          imageUrl: prop.cover?.original_url || prop.cover?.small_url,
          metadata: prop as object,
        },
        update: {
          name: prop.title,
          address: prop.address,
          currency: prop.channels?.[0]?.currency || 'USD',
          timezone: prop.timezone || 'UTC',
          imageUrl: prop.cover?.original_url || prop.cover?.small_url,
          metadata: prop as object,
        },
      })

      // 1b. Sync listings from property channels
      for (const channel of prop.channels ?? []) {
        await prisma.listing.upsert({
          where: { hostexId: channel.listing_id },
          create: {
            hostexId: channel.listing_id,
            propertyId: (await prisma.property.findUnique({ where: { hostexId } }))!.id,
            channel: channel.channel_type,
            channelName: channel.channel_type,
            currency: channel.currency || 'USD',
            isActive: true,
            metadata: channel as object,
          },
          update: {
            channel: channel.channel_type,
            channelName: channel.channel_type,
            currency: channel.currency || 'USD',
            metadata: channel as object,
          },
        })
      }
    }

    // 2. Sync room types
    const roomTypesRes = await client.getRoomTypes({ per_page: 100 })
    const roomTypes = roomTypesRes?.data?.room_types ?? []
    console.log(`[Sync] Fetched ${roomTypes.length} room types from Hostex`)

    for (const rt of roomTypes) {
      const rtHostexId = String(rt.id)
      // Room types in Hostex don't have a direct property_id; they have a properties array
      // For now, we'll skip room type sync if we can't determine the property
      // TODO: link room types to properties when the API provides the mapping
      console.log(`[Sync] Room type: ${rt.title} (id: ${rt.id})`)
    }

    // 3. Sync reservations
    const reservationsRes = await client.getReservations({ per_page: 100 })
    const reservations = reservationsRes?.data?.reservations ?? []
    console.log(`[Sync] Fetched ${reservations.length} reservations from Hostex`)

    for (const res of reservations) {
      const propHostexId = String(res.property_id)
      const property = await prisma.property.findUnique({
        where: { hostexId: propHostexId },
      })
      if (!property) continue

      // Extract total price from rates object
      const totalPrice = res.rates?.total_rate?.amount || undefined
      const currency = res.rates?.total_rate?.currency || 'USD'

      await prisma.reservation.upsert({
        where: { hostexId: res.reservation_code },
        create: {
          hostexId: res.reservation_code,
          propertyId: property.id,
          channel: res.channel_type,
          guestName: res.guest_name,
          guestEmail: res.guest_email || undefined,
          guestPhone: res.guest_phone || undefined,
          checkIn: new Date(res.check_in_date),
          checkOut: new Date(res.check_out_date),
          status: res.status,
          totalPrice,
          currency,
          numGuests: res.number_of_guests,
          confirmationCode: res.reservation_code,
          source: res.channel_type,
          metadata: res as object,
        },
        update: {
          channel: res.channel_type,
          guestName: res.guest_name,
          status: res.status,
          totalPrice,
          metadata: res as object,
        },
      })
    }

    // 4. Sync reviews
    const reviewsRes = await client.getReviews({ per_page: 100 })
    const reviews = reviewsRes?.data?.reviews ?? []
    console.log(`[Sync] Fetched ${reviews.length} reviews from Hostex`)

    for (const rev of reviews) {
      const propHostexId = String(rev.property_id)
      const property = await prisma.property.findUnique({
        where: { hostexId: propHostexId },
      })
      if (!property) continue

      // Use reservation_code as the unique hostex ID for reviews
      const reviewHostexId = `review-${rev.reservation_code}`

      // Extract rating and content from guest_review (what the guest said about the host)
      const guestRating = rev.guest_review?.score
      const guestContent = rev.guest_review?.content
      const hostContent = rev.host_review?.content

      await prisma.review.upsert({
        where: { hostexId: reviewHostexId },
        create: {
          hostexId: reviewHostexId,
          propertyId: property.id,
          reservationCode: rev.reservation_code,
          channel: rev.channel_type,
          guestName: undefined, // Not provided in review data
          rating: guestRating,
          content: guestContent,
          reviewDate: rev.guest_review?.created_at ? new Date(rev.guest_review.created_at) : null,
          metadata: rev as object,
        },
        update: {
          rating: guestRating,
          content: guestContent,
          metadata: rev as object,
        },
      })
    }

    // Note: Calendar sync skipped — the listing_calendars endpoint is not available
    // in the current Hostex API tier. Calendar data can be synced when/if the endpoint
    // becomes available.

    // Update connection status
    await prisma.hostexConnection.update({
      where: { id: connectionId },
      data: {
        lastSyncAt: new Date(),
        syncStatus: 'completed',
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        type: 'sync_completed',
        description: `Initial sync completed: ${properties.length} properties, ${reservations.length} reservations, ${reviews.length} reviews`,
        metadata: {
          connectionId,
          propertiesCount: properties.length,
          reservationsCount: reservations.length,
          reviewsCount: reviews.length,
        },
      },
    })

    console.log(`[Sync] Initial sync completed for connection ${connectionId}`)
  } catch (error) {
    console.error(`[Sync] Initial sync failed for connection ${connectionId}:`, error)

    const errMsg = error instanceof Error ? error.message : String(error)
    await prisma.hostexConnection.update({
      where: { id: connectionId },
      data: {
        syncStatus: 'failed',
        syncError: errMsg,
      },
    })

    throw error
  }
}
