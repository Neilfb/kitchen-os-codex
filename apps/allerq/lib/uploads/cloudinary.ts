import { v2 as cloudinary } from 'cloudinary'

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const API_KEY = process.env.CLOUDINARY_API_KEY
const API_SECRET = process.env.CLOUDINARY_API_SECRET

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.warn('[cloudinary] Missing configuration. Uploads will fail until CLOUDINARY_* env vars are set.')
} else {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
  })
}

export interface UploadLogoOptions {
  buffer: Buffer
  filename?: string
  folder?: string
  contentType?: string | null
}

export interface UploadLogoResult {
  url: string
  secureUrl: string
  publicId: string
  width?: number
  height?: number
  format?: string
  bytes?: number
}

export async function uploadLogoToCloudinary({
  buffer,
  filename,
  folder,
  contentType,
}: UploadLogoOptions): Promise<UploadLogoResult> {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    throw new Error('Cloudinary credentials are not configured')
  }

  const targetFolder = folder || process.env.CLOUDINARY_UPLOAD_FOLDER || 'allerq/logos'

  return new Promise<UploadLogoResult>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: targetFolder,
        resource_type: 'image',
        overwrite: false,
        unique_filename: true,
        use_filename: Boolean(filename),
        filename_override: filename,
        transformation: [
          {
            width: 512,
            height: 512,
            crop: 'limit',
          },
          {
            fetch_format: 'auto',
            quality: 'auto',
          },
        ],
        context: contentType ? `contentType=${contentType}` : undefined,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Unknown Cloudinary upload error'))
          return
        }

        resolve({
          url: result.url ?? result.secure_url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          width: result.width ?? undefined,
          height: result.height ?? undefined,
          format: result.format ?? undefined,
          bytes: result.bytes ?? undefined,
        })
      }
    )

    uploadStream.end(buffer)
  })
}

export interface UploadMenuFileOptions {
  buffer: Buffer
  filename?: string
  folder?: string
  contentType?: string | null
  resourceType?: 'raw' | 'auto'
}

export interface UploadMenuFileResult {
  url: string
  secureUrl: string
  publicId: string
  resourceType: string
  bytes?: number
  format?: string
  originalFilename?: string
}

export async function uploadMenuFileToCloudinary({
  buffer,
  filename,
  folder,
  contentType,
  resourceType = 'raw',
}: UploadMenuFileOptions): Promise<UploadMenuFileResult> {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    throw new Error('Cloudinary credentials are not configured')
  }

  const targetFolder =
    folder || process.env.CLOUDINARY_MENU_UPLOAD_FOLDER || process.env.CLOUDINARY_UPLOAD_FOLDER || 'allerq/menus'

  return new Promise<UploadMenuFileResult>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: targetFolder,
        resource_type: resourceType,
        overwrite: false,
        unique_filename: true,
        use_filename: Boolean(filename),
        filename_override: filename,
        context: contentType ? `contentType=${contentType}` : undefined,
        type: 'upload',
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Unknown Cloudinary upload error'))
          return
        }

        resolve({
          url: result.url ?? result.secure_url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type ?? resourceType,
          bytes: result.bytes ?? undefined,
          format: result.format ?? undefined,
          originalFilename: result.original_filename ?? undefined,
        })
      }
    )

    uploadStream.end(buffer)
  })
}
