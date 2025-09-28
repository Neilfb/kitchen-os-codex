export const BASE_URL = 'https://api.nocodebackend.com'
export const INSTANCE = '48346_allerq'

export function getNcdbCredentials() {
  const apiKey = process.env.NCDB_API_KEY
  const secret = process.env.NCDB_SECRET

  if (!apiKey) {
    throw new Error('NCDB_API_KEY is not set')
  }

  if (!secret) {
    throw new Error('NCDB_SECRET is not set')
  }

  return { apiKey, secret }
}
