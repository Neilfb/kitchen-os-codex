import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth/nextAuth'
import { actorHasMenuCapability, actorHasRestaurantAccess, buildActorFromSession } from '@/lib/menus/access'
import { getMenuUploadById, getMenuUploadItems, updateMenuUpload, updateMenuUploadItem } from '@/lib/ncb/menuUploads'
import { getRestaurantById } from '@/lib/ncb/getRestaurantById'
import { MenuUploadItemStatusSchema } from '@/types/ncdb/menuUpload'
import { appendActivityEvent, type ActivityEvent } from '@/lib/menus/activity'

export const runtime = 'nodejs'

const UpdateMenuUploadItemApiSchema = z
  .object({
    status: MenuUploadItemStatusSchema.optional(),
  })
  .refine(
    (data) => {
      if (!data.status) return false
      const lower = data.status.toLowerCase()
      return lower === 'discarded' || lower === 'needs_review'
    },
    { message: 'Only discarded or needs_review status updates are supported.' }
  )

interface RouteContext {
  params: {
    uploadId: string
    itemId: string
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const uploadId = Number(context.params.uploadId)
  const itemId = Number(context.params.itemId)

  if (!Number.isFinite(uploadId) || uploadId <= 0 || !Number.isFinite(itemId) || itemId <= 0) {
    return NextResponse.json({ status: 'error', message: 'Invalid upload item reference' }, { status: 400 })
  }

  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ status: 'error', message: 'Authentication required' }, { status: 401 })
  }

  const actor = buildActorFromSession(session as Parameters<typeof buildActorFromSession>[0])

  if (!actorHasMenuCapability(actor)) {
    return NextResponse.json({ status: 'error', message: 'You do not have permission to manage menus' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsedPayload = UpdateMenuUploadItemApiSchema.safeParse(body)

  if (!parsedPayload.success) {
    return NextResponse.json(
      { status: 'error', message: 'Invalid payload', errors: parsedPayload.error.flatten() },
      { status: 400 }
    )
  }

  const uploadRecord = await getMenuUploadById({ id: uploadId })

  if (!uploadRecord) {
    return NextResponse.json({ status: 'error', message: 'Menu upload not found' }, { status: 404 })
  }

  const uploadItems = await getMenuUploadItems({ uploadId })
  const targetItem = uploadItems.find((entry) => Number(entry.id) === itemId)

  if (!targetItem) {
    return NextResponse.json({ status: 'error', message: 'Menu upload item not found' }, { status: 404 })
  }

  const restaurantId =
    uploadRecord.restaurant_id ??
    (() => {
      const metadata = uploadRecord.metadata as Record<string, unknown> | undefined
      const candidate = metadata?.restaurantId ?? metadata?.restaurant_id
      if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate
      if (typeof candidate === 'string' && candidate.trim()) {
        const parsed = Number(candidate.trim())
        if (Number.isFinite(parsed)) return parsed
      }
      return undefined
    })()

  if (!restaurantId) {
    return NextResponse.json(
      { status: 'error', message: 'Menu upload is missing restaurant context' },
      { status: 422 }
    )
  }

  const restaurantRecord = await getRestaurantById({ id: Number(restaurantId) }).catch((error) => {
    console.error('[api/menus/uploads/:uploadId/items/:itemId] failed to load restaurant', error)
    return null
  })

  if (!restaurantRecord || !actorHasRestaurantAccess(actor, Number(restaurantId), { ownerId: restaurantRecord.owner_id })) {
    return NextResponse.json(
      { status: 'error', message: 'You are not assigned to the requested restaurant' },
      { status: 403 }
    )
  }

  try {
    const existingMetadata = (targetItem.metadata as Record<string, unknown> | undefined) ?? {}
    const previousAudit = Array.isArray(existingMetadata.auditTrail) ? existingMetadata.auditTrail : []
    const timestamp = Date.now()
    const auditEntry = {
      action: 'discard',
      actorEmail: actor.email,
      actorId: actor.id,
      uploadId,
      uploadItemId: itemId,
      reason: 'user_discard',
      timestamp,
      aiPayload: targetItem.ai_payload ?? null,
    }

    const updated = await updateMenuUploadItem({
      id: itemId,
      status: parsedPayload.data.status,
      metadata: {
        ...existingMetadata,
        lastAction: 'discard',
        lastActionAt: timestamp,
        lastDiscardActor: actor.email,
        aiPayload: targetItem.ai_payload,
        auditTrail: [...previousAudit, auditEntry],
      },
    })

    const activityEvent: ActivityEvent = {
      type: 'item_discarded',
      timestamp,
      uploadId,
      restaurantId,
      menuId: targetItem.menu_id,
      itemId,
      itemName: targetItem.name ?? 'Untitled Dish',
      actorEmail: actor.email,
      actorId: actor.id,
      payload: {
        aiPayload: targetItem.ai_payload ?? null,
      },
    }

    const updatedUploadMetadata = appendActivityEvent(uploadRecord.metadata as Record<string, unknown> | undefined, activityEvent)

    await updateMenuUpload({
      id: uploadId,
      metadata: updatedUploadMetadata,
    }).catch((error) => {
      console.warn('[api/menus/uploads/:uploadId/items/:itemId] failed to append discard activity', error)
    })

    console.log('[menu-upload/discard]', {
      actorEmail: actor.email,
      actorId: actor.id,
      uploadId,
      uploadItemId: itemId,
      status: parsedPayload.data.status,
    })

    return NextResponse.json(
      {
        status: 'success',
        data: updated,
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update menu upload item'
    console.error('[api/menus/uploads/:uploadId/items/:itemId] update error', error)
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
