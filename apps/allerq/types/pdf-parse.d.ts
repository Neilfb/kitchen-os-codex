declare module 'pdf-parse' {
  interface PdfMetadata {
    info?: Record<string, unknown>
    metadata?: Record<string, unknown>
    numpages?: number
  }

  interface PdfParseResult {
    text: string
    info: PdfMetadata['info']
    metadata: PdfMetadata['metadata']
    numpages: number
  }

  type PdfParse = (dataBuffer: Buffer, options?: Record<string, unknown>) => Promise<PdfParseResult>

  const pdfParse: PdfParse
  export default pdfParse
}
