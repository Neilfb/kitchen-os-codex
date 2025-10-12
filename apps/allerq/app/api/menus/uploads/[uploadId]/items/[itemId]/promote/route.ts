import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth/nextAuth'
import { getMenuUploadById, getMenuUploadItems, updateMenuUpload, updateMenuUploadItem } from '@/lib/ncb/menuUploads'
import { actorHasMenuCapability, actorHasRestaurantAccess, buildActorFromSession } from '@/lib/menus/access'
import { getMenuById } from '@/lib/ncb/getMenuById'
import { createMenuItem } from '@/lib/ncb/menuItem'
import { appendActivityEvent, type ActivityEvent } from '@/lib/menus/activity'

export const runtime = 'nodejs'

const PromoteMenuUploadItemSchema = z.object({
  menuId: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === null || value === undefined) return undefined
      if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
      const trimmed = value.trim()
      if (!trimmed) return undefined
      const parsed = Number(trimmed)
      return Number.isFinite(parsed) ? parsed : undefined
    })
    .optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  price: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === null || value === undefined) return undefined
      if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
      const trimmed = value.trim()
      if (!trimmed) return undefined
      const parsed = Number(trimmed)
      return Number.isFinite(parsed) ? parsed : undefined
    })
    .optional(),
  category: z.string().optional(),
})

interface RouteContext {
  params: { uploadId: string; itemId: string }
}

function toCommaSeparated(labels: Array<{ label: string }> | undefined): string | undefined {
  if (!labels || labels.length === 0) {
    return undefined
  }
  const normalized = labels
    .map((entry) => entry?.label?.trim())
    .filter((entry): entry is string => Boolean(entry))

  return normalized.length > 0 ? normalized.join(', ') : undefined
}

function fallbackName(name?: string, rawText?: string): string {
  if (name && name.trim()) {
    return name.trim()
  }
  if (rawText && rawText.trim()) {
    const firstLine = rawText.trim().split(/\r?\n/)[0]
    if (firstLine) {
      return firstLine.trim().slice(0, 120)
    }
  }
  return 'Untitled Dish'
}

export async function POST(request: Request, context: RouteContext) {
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

  const uploadRecord = await getMenuUploadById({ id: uploadId })

  if (!uploadRecord) {
    return NextResponse.json({ status: 'error', message: 'Menu upload not found' }, { status: 404 })
  }

  const metadata = uploadRecord.metadata as Record<string, unknown> | undefined
  const restaurantId =
    uploadRecord.restaurant_id ??
    (() => {
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

  if (!actorHasRestaurantAccess(actor, restaurantId)) {
    return NextResponse.json(
      { status: 'error', message: 'You are not assigned to the requested restaurant' },
      { status: 403 }
    )
  }

  const uploadItems = await getMenuUploadItems({ uploadId })
  const targetItem = uploadItems.find((entry) => Number(entry.id) === itemId)

  if (!targetItem) {
    return NextResponse.json({ status: 'error', message: 'Menu upload item not found' }, { status: 404 })
  }

  if (targetItem.status === 'completed') {
    return NextResponse.json(
      { status: 'error', message: 'Menu upload item is already marked as completed' },
      { status: 409 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const payload = PromoteMenuUploadItemSchema.safeParse(body)

  if (!payload.success) {
    return NextResponse.json(
      { status: 'error', message: 'Invalid payload', errors: payload.error.flatten() },
      { status: 400 }
    )
  }

  const requestedMenuId =
    payload.data.menuId ??
    (typeof uploadRecord.menu_id === 'number' && Number.isFinite(uploadRecord.menu_id)
      ? uploadRecord.menu_id
      : undefined)

  if (!requestedMenuId) {
    return NextResponse.json(
      { status: 'error', message: 'Target menu id is required to promote upload items' },
      { status: 422 }
    )
  }

  const menuRecord = await getMenuById({ id: requestedMenuId })

  if (!menuRecord) {
    return NextResponse.json({ status: 'error', message: 'Menu not found' }, { status: 404 })
  }

  if (Number(menuRecord.restaurant_id) !== Number(restaurantId)) {
    return NextResponse.json(
      { status: 'error', message: 'Menu does not belong to the upload restaurant' },
      { status: 409 }
    )
  }

  const name = fallbackName(payload.data.name ?? targetItem.name, targetItem.raw_text)
  const description =
    payload.data.description?.trim() ?? targetItem.description?.trim() ?? undefined
  const price = payload.data.price ?? targetItem.price ?? undefined
  const category =
    payload.data.category?.trim() ?? targetItem.suggested_category?.trim() ?? undefined

  try {
    if (price !== undefined && (!Number.isFinite(price) || price < 0)) {
      throw new Error('Price must be a non-negative number')
    }

    const existingMetadata = (targetItem.metadata as Record<string, unknown> | undefined) ?? {}
    const previousAudit = Array.isArray(existingMetadata.auditTrail) ? existingMetadata.auditTrail : []
    const timestamp = Date.now()

    const trimmedInputName = payload.data.name?.trim()
    const trimmedInputDescription = payload.data.description?.trim()
    const trimmedInputCategory = payload.data.category?.trim()

    const overrides: Record<string, unknown> = {}
    if (trimmedInputName && trimmedInputName !== (targetItem.name?.trim() ?? '')) {
      overrides.name = trimmedInputName
    }
    if (trimmedInputDescription && trimmedInputDescription !== (targetItem.description?.trim() ?? '')) {
      overrides.description = trimmedInputDescription
    }
    if (payload.data.price !== undefined && payload.data.price !== targetItem.price) {
      overrides.price = payload.data.price
    }
    if (trimmedInputCategory && trimmedInputCategory !== (targetItem.suggested_category?.trim() ?? '')) {
      overrides.category = trimmedInputCategory
    }

    const auditEntry = {
      action: 'promote',
      actorEmail: actor.email,
      actorId: actor.id,
      uploadId,
      uploadItemId: itemId,
      menuId: requestedMenuId,
      timestamp,
      aiPayload: targetItem.ai_payload ?? null,
      overrides,
    }

    const created = await createMenuItem({
      menu_id: requestedMenuId,
      restaurant_id: restaurantId,
      name,
      description,
      price,
      category,
      allergens: toCommaSeparated(targetItem.suggested_allergens as Array<{ label: string }> | undefined) ?? '',
      dietary: toCommaSeparated(targetItem.suggested_dietary as Array<{ label: string }> | undefined) ?? '',
    })

    await updateMenuUploadItem({
      id: itemId,
      status: 'completed',
      menu_id: requestedMenuId,
      restaurant_id: restaurantId,
      metadata: {
        ...existingMetadata,
        lastActionAt: timestamp,
        lastAction: 'promote',
        overrides,
        aiPayload: targetItem.ai_payload,
        auditTrail: [...previousAudit, auditEntry],
      },
    })

    const activityEvent: ActivityEvent = {
      type: 'item_promoted',
      timestamp,
      uploadId,
      restaurantId,
      menuId: requestedMenuId,
      itemId,
      itemName: name,
      actorEmail: actor.email,
      actorId: actor.id,
      payload: {
        overrides,
        aiPayload: targetItem.ai_payload ?? null,
        menuItemId: created.id,
      },
    }

    const updatedUploadMetadata = appendActivityEvent(metadata ?? {}, activityEvent)

    await updateMenuUpload({
      id: uploadId,
      metadata: updatedUploadMetadata,
    }).catch((error) => {
      console.warn('[api/menus/uploads/:uploadId/items/:itemId/promote] failed to append upload activity', error)
    })

    console.log('[menu-upload/promote]', {
      actorEmail: actor.email,
      actorId: actor.id,
      uploadId,
      uploadItemId: itemId,
      menuId: requestedMenuId,
      menuItemId: created.id,
    })

    return NextResponse.json(
      {
        status: 'success',
        data: created,
        uploadItemId: itemId,
      },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create menu item from upload'
    console.error('[api/menus/uploads/:uploadId/items/:itemId/promote] error', error)
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
