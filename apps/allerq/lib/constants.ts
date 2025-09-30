if (
  !process.env.NCDB_API_KEY ||
  !(process.env.NCDB_SECRET_KEY || process.env.NCDB_SECRET) ||
  !process.env.NCDB_INSTANCE
) {
  throw new Error(
    '❌ Missing NCDB environment variables. Please check your .env.local file.'
  )
}

export const NCDB_API_KEY = process.env.NCDB_API_KEY!
export const NCDB_INSTANCE = process.env.NCDB_INSTANCE!
export const NCDB_SECRET = (process.env.NCDB_SECRET_KEY || process.env.NCDB_SECRET)!
