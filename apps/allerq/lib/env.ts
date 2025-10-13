/**
 * Centralised helpers for accessing server-side environment variables.
 * Adds support for common alias keys (historical secrets in Vercel)
 * and emits focused diagnostics when required values are missing.
 */

if (typeof window !== 'undefined') {
  throw new Error('env.ts must only be imported from server-side code')
}

const FALLBACK_MAP: Record<
  string,
  { aliases?: string[]; redacted?: boolean }
> = {
  NCDB_API_KEY: { redacted: true },
  NCDB_SECRET_KEY: { aliases: ['NCDB_SECRET'], redacted: true },
  NCDB_INSTANCE: { aliases: ['NCDB_INSTANCE_ID'] },
  CLOUDINARY_CLOUD_NAME: {
    aliases: ['CLOUDINARY_NAME', 'CLOUD_NAME'],
  },
  CLOUDINARY_API_KEY: {
    aliases: ['CLOUDINARY_KEY'],
    redacted: true,
  },
  CLOUDINARY_API_SECRET: {
    aliases: ['CLOUDINARY_SECRET', 'CLOUDINARY_SECRET_KEY'],
    redacted: true,
  },
}

function readEnvValue(name: string): string | undefined {
  const config = FALLBACK_MAP[name]
  const direct = process.env[name]
  if (direct && direct.trim()) {
    return direct.trim()
  }

  if (config?.aliases) {
    for (const alias of config.aliases) {
      const value = process.env[alias]
      if (value && value.trim()) {
        console.warn(`[env] Using fallback env "${alias}" for "${name}"`)
        return value.trim()
      }
    }
  }

  return undefined
}

export function getRequiredServerEnv(name: string): string {
  const value = readEnvValue(name)

  if (value) {
    return value
  }

  const configuredEntrypoints = Object.keys(process.env)
    .filter((key) => key.includes('NCDB') || key.includes('CLOUDINARY'))
    .sort()

  const aliasInfo = FALLBACK_MAP[name]?.aliases
    ? `(checked aliases: ${FALLBACK_MAP[name]?.aliases?.join(', ')})`
    : ''

  console.error(
    `[env] Missing required environment variable "${name}". ${aliasInfo} Visible related keys: ${configuredEntrypoints.join(', ')}`
  )

  throw new Error(`Environment variable ${name} is required for application runtime`)
}

export function getOptionalServerEnv(name: string): string | undefined {
  const value = readEnvValue(name)
  return value === undefined ? undefined : value
}
