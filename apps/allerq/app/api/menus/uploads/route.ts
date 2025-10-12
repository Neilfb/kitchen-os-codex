import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/nextAuth'
import { createMenuUpload, getMenuUploads } from '@/lib/ncb/menuUploads'
import { getRestaurantById } from '@/lib/ncb/getRestaurantById'
import {
  MAX_MENU_UPLOAD_FILE_SIZE_BYTES,
  MENU_UPLOAD_ALLOWED_EXTENSIONS,
  MENU_UPLOAD_ALLOWED_MIME_TYPES,
} from '@/lib/menus/constants'
import { actorHasMenuCapability, actorHasRestaurantAccess, buildActorFromSession } from '@/lib/menus/access'
import { uploadMenuFileToCloudinary } from '@/lib/uploads/cloudinary'
import type { MenuUploadStatus } from '@/types/ncdb/menuUpload'
import { MenuUploadStatusSchema } from '@/types/ncdb/menuUpload'

export const runtime = 'nodejs'

const ALLOWED_MIME_TYPES = new Set(MENU_UPLOAD_ALLOWED_MIME_TYPES.map((value) => value.toLowerCase()))
const ALLOWED_EXTENSIONS = new Set(MENU_UPLOAD_ALLOWED_EXTENSIONS.map((value) => value.toLowerCase()))

function statusFromErrorMessage(message: string): number {
  if (message.toLowerCase().includes('not provisioned')) {
    return 503
  }
  if (message.toLowerCase().includes('missing restaurant context')) {
    return 422
  }
  return 500
}

function inferMenuMimeType(file: File): string | null {
  if (file.type && file.type !== 'application/octet-stream') {
    return file.type.toLowerCase()
  }

  const lowerName = file.name?.toLowerCase() ?? ''
  if (lowerName.endsWith('.pdf')) return 'application/pdf'
  if (lowerName.endsWith('.doc')) return 'application/msword'
  if (lowerName.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  return null
}

function getFileExtension(fileName: string | undefined): string | null {
  if (!fileName) return null
  const lowerName = fileName.toLowerCase()
  const lastDot = lowerName.lastIndexOf('.')
  if (lastDot === -1 || lastDot === lowerName.length - 1) {
    return null
  }
  return lowerName.slice(lastDot)
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ status: 'error', message: 'Authentication required' }, { status: 401 })
    }

    const actor = buildActorFromSession(session)

    if (!actorHasMenuCapability(actor)) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'You do not have permission to upload menus',
        },
        { status: 403 }
      )
    }

    const formData = await request.formData()

    const file = formData.get('file')
    const restaurantIdRaw = formData.get('restaurantId') ?? formData.get('restaurant_id')
    const menuIdRaw = formData.get('menuId') ?? formData.get('menu_id')

    if (!(file instanceof File)) {
      return NextResponse.json({ status: 'error', message: 'No file uploaded' }, { status: 400 })
    }

    const restaurantId = Number(restaurantIdRaw)
    const normalizedMenuIdRaw = typeof menuIdRaw === 'string' ? menuIdRaw.trim() : undefined
    const menuId =
      normalizedMenuIdRaw === undefined || normalizedMenuIdRaw === ''
        ? undefined
        : Number(normalizedMenuIdRaw)

    if (!Number.isFinite(restaurantId) || restaurantId <= 0) {
      return NextResponse.json(
        { status: 'error', message: 'Valid restaurantId is required for menu uploads' },
        { status: 400 }
      )
    }

    if (
      normalizedMenuIdRaw !== undefined &&
      normalizedMenuIdRaw !== '' &&
      (!Number.isFinite(menuId) || (menuId ?? 0) <= 0)
    ) {
      return NextResponse.json(
        { status: 'error', message: 'If provided, menuId must be a positive number' },
        { status: 400 }
      )
    }

    const restaurantRecord = await getRestaurantById({ id: restaurantId }).catch((error) => {
      console.error('[api/menus/uploads] failed to load restaurant', error)
      return null
    })

    if (!restaurantRecord) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Restaurant not found',
        },
        { status: 404 }
      )
    }

    if (!actorHasRestaurantAccess(actor, restaurantId, { ownerId: restaurantRecord.owner_id })) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'You are not assigned to the requested restaurant',
        },
        { status: 403 }
      )
    }

    if (file.size > MAX_MENU_UPLOAD_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Menu file must be 10MB or smaller',
        },
        { status: 400 }
      )
    }

    const mimeType = inferMenuMimeType(file)
    const extension = getFileExtension(file.name)

    if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Only PDF and Word document menu uploads are allowed',
        },
        { status: 400 }
      )
    }

    if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'The menu file extension is not supported',
        },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploadResult = await uploadMenuFileToCloudinary({
      buffer,
      filename: file.name,
      contentType: mimeType,
    })

    const uploadRecord = await createMenuUpload({
      restaurant_id: restaurantId,
      menu_id: menuId,
      file_url: uploadResult.secureUrl ?? uploadResult.url,
      file_name: uploadResult.originalFilename ?? file.name,
      file_size: uploadResult.bytes ?? file.size,
      resource_type: uploadResult.resourceType,
      status: 'pending',
      parser_version: process.env.ALLERQ_MENU_PARSER_VERSION,
      metadata: {
        publicId: uploadResult.publicId,
        originalFileName: file.name,
        uploadedBy: actor.email,
        contentType: mimeType,
      },
    })

    return NextResponse.json(
      {
        status: 'success',
        data: {
          uploadId: uploadRecord.id,
          menuUpload: uploadRecord,
          cloudinary: {
            publicId: uploadResult.publicId,
            url: uploadResult.secureUrl ?? uploadResult.url,
            bytes: uploadResult.bytes,
            format: uploadResult.format,
            resourceType: uploadResult.resourceType,
          },
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
    const message = error instanceof Error ? error.message : 'Failed to upload menu file'
    console.error('[api/menus/uploads] error', error)
    return NextResponse.json({ status: 'error', message }, { status: statusFromErrorMessage(message) })
  }
}

export async function GET(request: Request) {
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

    const url = new URL(request.url)
    const restaurantIdParam = url.searchParams.get('restaurantId') ?? url.searchParams.get('restaurant_id')
    const menuIdParam = url.searchParams.get('menuId') ?? url.searchParams.get('menu_id')
    const statusParams = url.searchParams.getAll('status')

    if (!restaurantIdParam) {
      return NextResponse.json(
        { status: 'error', message: 'restaurantId query parameter is required' },
        { status: 400 }
      )
    }

    const restaurantId = Number(restaurantIdParam)
    if (!Number.isFinite(restaurantId) || restaurantId <= 0) {
      return NextResponse.json(
        { status: 'error', message: 'restaurantId must be a positive number' },
        { status: 400 }
      )
    }

    const restaurantRecord = await getRestaurantById({ id: restaurantId }).catch((error) => {
      console.error('[api/menus/uploads] failed to load restaurant', error)
      return null
    })

    if (!restaurantRecord) {
      return NextResponse.json(
        { status: 'error', message: 'Restaurant not found' },
        { status: 404 }
      )
    }

    if (!actorHasRestaurantAccess(actor, restaurantId, { ownerId: restaurantRecord.owner_id })) {
      return NextResponse.json(
        { status: 'error', message: 'You are not assigned to the requested restaurant' },
        { status: 403 }
      )
    }

    let menuId: number | undefined
    if (menuIdParam !== null) {
      const normalizedMenuId = menuIdParam.trim()
      if (normalizedMenuId.length === 0) {
        menuId = undefined
      } else {
        const parsedMenuId = Number(normalizedMenuId)
        if (!Number.isFinite(parsedMenuId) || parsedMenuId <= 0) {
          return NextResponse.json(
            { status: 'error', message: 'menuId must be a positive number when provided' },
            { status: 400 }
          )
        }
        menuId = parsedMenuId
      }
    }

    const normalizedStatusInputs = statusParams
      .flatMap((entry) => entry.split(','))
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .map((value) => value.toLowerCase())

    let statuses: MenuUploadStatus[] | undefined
    if (normalizedStatusInputs.length > 0) {
      const parsedStatuses: MenuUploadStatus[] = []
      const invalidStatuses: string[] = []

      for (const value of normalizedStatusInputs) {
        const result = MenuUploadStatusSchema.safeParse(value)
        if (result.success) {
          parsedStatuses.push(result.data)
        } else {
          invalidStatuses.push(value)
        }
      }

      if (invalidStatuses.length > 0) {
        return NextResponse.json(
          {
            status: 'error',
            message: `Invalid status value(s): ${invalidStatuses.join(', ')}`,
          },
          { status: 400 }
        )
      }

      statuses = parsedStatuses
    }

    const uploads = await getMenuUploads({
      restaurantId,
      menuId,
      status: statuses?.length === 1 ? statuses[0] : statuses,
    })

    return NextResponse.json(
      {
        status: 'success',
        data: uploads,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load menu uploads'
    console.error('[api/menus/uploads] error', error)
    return NextResponse.json({ status: 'error', message }, { status: statusFromErrorMessage(message) })
  }
}
