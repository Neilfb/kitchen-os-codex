declare module 'mammoth' {
  interface ExtractRawTextResult {
    value: string
    messages: Array<{ type: string; message: string }>
  }

  interface ExtractRawTextOptions {
    styleMap?: string[]
    includeDefaultStyleMap?: boolean
  }

  export function extractRawText(
    input: { buffer: Buffer },
    options?: ExtractRawTextOptions
  ): Promise<ExtractRawTextResult>
}
