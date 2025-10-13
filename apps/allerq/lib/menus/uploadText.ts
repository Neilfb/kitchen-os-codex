import path from 'node:path'

import axios from 'axios'
import { extractRawText } from 'mammoth'

import type { MenuUploadRecord } from '@/types/ncdb/menuUpload'

type ExtractionSource = 'pdf' | 'docx' | 'plain'

export interface UploadTextExtraction {
  text: string
  source: ExtractionSource
  contentType?: string
  pageCount?: number
}

const PDF_MIME_TYPES = new Set(['application/pdf'])
const DOCX_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
])
const TEXT_MIME_TYPES = new Set(['text/plain', 'application/json'])

const SUPPORTED_EXTENSIONS: Record<string, ExtractionSource> = {
  '.pdf': 'pdf',
  '.docx': 'docx',
  '.txt': 'plain',
  '.json': 'plain',
}

function normalizeWhitespace(input: string): string {
  return input
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function inferExtension(fileName: string | undefined): string | undefined {
  if (!fileName) {
    return undefined
  }
  const normalized = fileName.split('?')[0]
  const extension = path.extname(normalized).toLowerCase()
  return extension || undefined
}

function inferSourceFromMime(mimeType: string | undefined): ExtractionSource | undefined {
  if (!mimeType) return undefined
  if (PDF_MIME_TYPES.has(mimeType)) return 'pdf'
  if (DOCX_MIME_TYPES.has(mimeType)) return 'docx'
  if (TEXT_MIME_TYPES.has(mimeType)) return 'plain'
  return undefined
}

function getMetadataValue(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = metadata?.[key]
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }
  return undefined
}

function extractContentType(headers: Record<string, unknown> | undefined): string | undefined {
  if (!headers) {
    return undefined
  }
  const raw = headers['content-type'] ?? headers['Content-Type']
  if (typeof raw !== 'string') {
    return undefined
  }
  return raw.split(';')[0]?.trim().toLowerCase() ?? undefined
}

export class UnsupportedMenuUploadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnsupportedMenuUploadError'
  }
}

export async function extractUploadText(upload: MenuUploadRecord): Promise<UploadTextExtraction> {
  const pdfParseModule = await import('pdf-parse')
  const pdfParse = (pdfParseModule.default ?? pdfParseModule) as (data: Buffer) => Promise<{ text: string; numpages: number }>
  const url = upload.file_url
  if (!url) {
    throw new UnsupportedMenuUploadError('Menu upload is missing file_url')
  }

  const response = await axios.get<ArrayBuffer>(url, {
    responseType: 'arraybuffer',
    timeout: 60000,
  })

  const buffer = Buffer.from(response.data)
  if (buffer.byteLength === 0) {
    throw new UnsupportedMenuUploadError('Uploaded file is empty')
  }

  const contentType = extractContentType(response.headers)

  const metadata = upload.metadata as Record<string, unknown> | undefined
  const metadataFileName = getMetadataValue(metadata, 'originalFileName')
  const candidateFileName = metadataFileName || upload.file_name
  const extension = inferExtension(candidateFileName)

  const sourceHint = inferSourceFromMime(contentType) || (extension ? SUPPORTED_EXTENSIONS[extension] : undefined)

  if (sourceHint === 'pdf') {
    const parsed = await pdfParse(buffer).catch((error) => {
      throw new UnsupportedMenuUploadError(`Failed to parse PDF menu: ${(error as Error).message}`)
    })
    const text = normalizeWhitespace(parsed.text)
    if (!text) {
      throw new UnsupportedMenuUploadError('PDF parser returned empty text')
    }
    return {
      text,
      source: 'pdf',
      contentType,
      pageCount: parsed.numpages,
    }
  }

  if (sourceHint === 'docx') {
    const parsed = await extractRawText({ buffer }).catch((error) => {
      throw new UnsupportedMenuUploadError(`Failed to parse DOCX menu: ${(error as Error).message}`)
    })
    const text = normalizeWhitespace(parsed.value)
    if (!text) {
      throw new UnsupportedMenuUploadError('DOCX parser returned empty text')
    }
    return {
      text,
      source: 'docx',
      contentType,
    }
  }

  if (sourceHint === 'plain') {
    const text = normalizeWhitespace(buffer.toString('utf8'))
    if (!text) {
      throw new UnsupportedMenuUploadError('Text menu contains no readable content')
    }
    return {
      text,
      source: 'plain',
      contentType,
    }
  }

  throw new UnsupportedMenuUploadError(
    `Unsupported menu upload type. Content-Type: ${contentType ?? 'unknown'}, extension: ${extension ?? 'unknown'}`
  )
}
