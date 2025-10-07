import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/nextAuth'
import { buildSessionUser, userHasCapability } from '@/lib/auth/permissions'
import { uploadLogoToCloudinary } from '@/lib/uploads/cloudinary'

const MAX_FILE_SIZE_BYTES = 1_000_000 // 1 MB
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])

export const runtime = 'nodejs'

function inferMimeType(file: File): string | null {
  if (file.type && file.type !== 'application/octet-stream') {
    return file.type
  }

  const lowerName = file.name?.toLowerCase() ?? ''
  if (lowerName.endsWith('.png')) return 'image/png'
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'image/jpeg'
  if (lowerName.endsWith('.webp')) return 'image/webp'
  return null
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Authentication required',
        },
        { status: 401 }
      )
    }

    const actor = buildSessionUser({
      id: (session.user as { id?: string | number })?.id?.toString() ?? session.user.email,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      assignedRestaurants: session.user.assignedRestaurants,
      capabilities: session.user.capabilities,
      userId: (session.user as { ncdbUserId?: number | string })?.ncdbUserId,
    })

    if (
      !userHasCapability(actor, 'restaurant.create') &&
      !userHasCapability(actor, 'restaurant.manage:any') &&
      !userHasCapability(actor, 'restaurant.manage:own') &&
      !userHasCapability(actor, 'restaurant.manage:assigned')
    ) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'You do not have permission to upload logos',
        },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'No file uploaded',
        },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Logo must be smaller than 1MB',
        },
        { status: 400 }
      )
    }

    const mimeType = inferMimeType(file)

    if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Only PNG, JPG, or WebP logos are allowed',
        },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploadResult = await uploadLogoToCloudinary({
      buffer,
      filename: file.name,
      folder: process.env.CLOUDINARY_UPLOAD_FOLDER,
      contentType: mimeType,
    })

    return NextResponse.json(
      {
        status: 'success',
        data: {
          logoUrl: uploadResult.secureUrl ?? uploadResult.url,
          publicId: uploadResult.publicId,
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
          bytes: uploadResult.bytes,
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
    const message = error instanceof Error ? error.message : 'Failed to upload logo'
    console.error('[api/uploads/logo] upload failed', error)

    return NextResponse.json(
      {
        status: 'error',
        message,
      },
      { status: 500 }
    )
  }
}
