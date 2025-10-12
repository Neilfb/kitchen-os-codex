import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/nextAuth'
import { actorHasMenuCapability, actorHasRestaurantAccess, buildActorFromSession } from '@/lib/menus/access'
import { getMenuUploadById, getMenuUploadItems } from '@/lib/ncb/menuUploads'
import { getRestaurantById } from '@/lib/ncb/getRestaurantById'
import type { MenuUploadItemRecord } from '@/types/ncdb/menuUpload'

export const runtime = 'nodejs'

function getNumericMetadataValue(metadata: Record<string, unknown> | undefined, key: string): number | undefined {
  const value = metadata?.[key]
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim())
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return undefined
}

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: { id: string }
  }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ status: 'error', message: 'Authentication required' }, { status: 401 })
    }

    const actor = buildActorFromSession(session)

    if (!actorHasMenuCapability(actor)) {
      return NextResponse.json(
        { status: 'error', message: 'You do not have permission to view menu uploads' },
        { status: 403 }
      )
    }

    const uploadId = Number(params.id)
    if (!Number.isFinite(uploadId) || uploadId <= 0) {
      return NextResponse.json({ status: 'error', message: 'Upload id must be a positive number' }, { status: 400 })
    }

    const url = new URL(request.url)
    const includeItemsParam = url.searchParams.get('includeItems') ?? url.searchParams.get('include_items')
    const includeItems = includeItemsParam ? includeItemsParam.toLowerCase() === 'true' : false

    const upload = await getMenuUploadById({ id: uploadId })

    if (!upload) {
      return NextResponse.json({ status: 'error', message: 'Menu upload not found' }, { status: 404 })
    }

    const targetRestaurantId =
      upload.restaurant_id ??
      getNumericMetadataValue(upload.metadata as Record<string, unknown> | undefined, 'restaurantId')

    if (!targetRestaurantId || Number.isNaN(targetRestaurantId) || targetRestaurantId <= 0) {
      return NextResponse.json(
        { status: 'error', message: 'Menu upload is missing restaurant context' },
        { status: 422 }
      )
    }

    const restaurantRecord = await getRestaurantById({ id: targetRestaurantId }).catch((error) => {
      console.error('[api/menus/uploads/:id] failed to load restaurant', error)
      return null
    })

    if (!restaurantRecord) {
      return NextResponse.json({ status: 'error', message: 'Restaurant not found' }, { status: 404 })
    }

    if (!actorHasRestaurantAccess(actor, targetRestaurantId, { ownerId: restaurantRecord.owner_id })) {
      return NextResponse.json(
        { status: 'error', message: 'You are not assigned to the requested restaurant' },
        { status: 403 }
      )
    }

    let items: MenuUploadItemRecord[] | undefined
    if (includeItems) {
      items = await getMenuUploadItems({ uploadId })
    }

    return NextResponse.json(
      {
        status: 'success',
        data: {
          upload,
          items,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load menu upload'
    console.error('[api/menus/uploads/:id] error', error)
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
