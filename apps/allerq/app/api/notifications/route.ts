import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/nextAuth'
import { buildActorFromSession, actorHasRestaurantAccess } from '@/lib/menus/access'
import { getMenuUploads } from '@/lib/ncb/menuUploads'
import { getRestaurantById } from '@/lib/ncb/getRestaurantById'
import type { ActivityEvent } from '@/lib/menus/activity'

type NotificationPayload = {
  id: string
  type: string
  title: string
  description: string
  timestamp: number
  restaurantId?: number
  menuId?: number
  uploadId?: number
}

function resolveRestaurantId(metadata: Record<string, unknown> | undefined, fallback?: number): number | undefined {
  if (typeof fallback === 'number' && Number.isFinite(fallback)) {
    return fallback
  }
  const candidate = metadata?.restaurantId ?? (metadata?.restaurant_id as unknown)
  if (typeof candidate === 'number' && Number.isFinite(candidate)) {
    return candidate
  }
  if (typeof candidate === 'string' && candidate.trim()) {
    const parsed = Number(candidate.trim())
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function eventToNotification(
  event: ActivityEvent,
  restaurantName: string | undefined
): NotificationPayload {
  const timestamp = event.timestamp
  const humanName = restaurantName ?? 'Restaurant'

  if (event.type === 'upload_ready') {
    const count = typeof event.itemCount === 'number' ? event.itemCount : undefined
    return {
      id: event.id ?? `${event.type}:${event.uploadId}:${timestamp}`,
      type: 'upload_ready',
      title: 'Menu items ready for review',
      description: count && count > 0
        ? `${count} new item${count === 1 ? '' : 's'} flagged for ${humanName}.`
        : `AI suggestions awaiting review for ${humanName}.`,
      timestamp,
      restaurantId: event.restaurantId,
      menuId: event.menuId,
      uploadId: event.uploadId,
    }
  }

  if (event.type === 'item_promoted') {
    return {
      id: event.id ?? `${event.type}:${event.uploadId}:${event.itemId ?? 'item'}:${timestamp}`,
      type: 'item_promoted',
      title: 'Menu item promoted',
      description: event.itemName
        ? `${event.itemName} was added to ${humanName}.`
        : `A suggestion was added to ${humanName}.`,
      timestamp,
      restaurantId: event.restaurantId,
      menuId: event.menuId,
      uploadId: event.uploadId,
    }
  }

  if (event.type === 'item_discarded') {
    return {
      id: event.id ?? `${event.type}:${event.uploadId}:${event.itemId ?? 'item'}:${timestamp}`,
      type: 'item_discarded',
      title: 'Suggestion discarded',
      description: event.itemName
        ? `${event.itemName} was dismissed from ${humanName}.`
        : `A suggestion was dismissed from ${humanName}.`,
      timestamp,
      restaurantId: event.restaurantId,
      menuId: event.menuId,
      uploadId: event.uploadId,
    }
  }

  return {
    id: event.id ?? `${event.type}:${event.uploadId}:${timestamp}`,
    type: event.type,
    title: 'Menu activity',
    description: `${humanName} has recent activity.`,
    timestamp,
    restaurantId: event.restaurantId,
    menuId: event.menuId,
    uploadId: event.uploadId,
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ status: 'error', message: 'Authentication required' }, { status: 401 })
  }

  const actor = buildActorFromSession(session)

  try {
    const uploads = await getMenuUploads()
    const notifications: NotificationPayload[] = []
    const restaurantCache = new Map<number, { allowed: boolean; name?: string }>()

    for (const upload of uploads) {
      const metadata = upload.metadata as Record<string, unknown> | undefined
      const restaurantId = resolveRestaurantId(metadata, upload.restaurant_id)
      if (!restaurantId) {
        continue
      }

      let access = restaurantCache.get(restaurantId)
      if (!access) {
        const restaurantRecord = await getRestaurantById({ id: restaurantId }).catch((error) => {
          console.error('[notifications] failed to load restaurant', { restaurantId, error })
          return null
        })
        const allowed =
          !!restaurantRecord && actorHasRestaurantAccess(actor, restaurantId, { ownerId: restaurantRecord.owner_id })
        access = {
          allowed,
          name: restaurantRecord?.name,
        }
        restaurantCache.set(restaurantId, access)
      }

      if (!access.allowed) {
        continue
      }

      const activityLog = Array.isArray(metadata?.activityLog) ? (metadata?.activityLog as ActivityEvent[]) : []
      for (const event of activityLog) {
        if (!event || typeof event !== 'object') continue
        // Only surface events from the last 30 days
        if (event.timestamp && Date.now() - event.timestamp > 1000 * 60 * 60 * 24 * 30) {
          continue
        }
        notifications.push(eventToNotification(event, access.name))
      }
    }

    notifications.sort((a, b) => b.timestamp - a.timestamp)

    return NextResponse.json(
      {
        status: 'success',
        data: notifications.slice(0, 50),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (error) {
    console.error('[api/notifications] error', error)
    return NextResponse.json(
      { status: 'error', message: 'Failed to load notifications' },
      { status: 500 }
    )
  }
}
