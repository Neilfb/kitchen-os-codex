#!/usr/bin/env tsx
import 'dotenv/config'
import axios from 'axios'

const email = process.argv[2]

if (!email) {
  console.error('Usage: pnpm --filter @kitchen-os/allerq exec tsx scripts/ncdb-get-user.ts <email>')
  process.exit(1)
}

const instance = process.env.NCDB_INSTANCE
const apiKey = process.env.NCDB_API_KEY
const secretKey = process.env.NCDB_SECRET_KEY
const baseUrl = (process.env.NCDB_BASE_URL || 'https://api.nocodebackend.com').replace(/\/$/, '')

if (!instance || !apiKey || !secretKey) {
  console.error('NCDB env vars are missing. Check .env.local or .env.test.')
  process.exit(1)
}

async function main() {
  const url = `${baseUrl}/search/users?Instance=${instance}`

  const { data } = await axios({
    method: 'post',
    url,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    data: {
      secret_key: secretKey,
      email: email.trim().toLowerCase(),
    },
  })

  console.log(JSON.stringify(data, null, 2))
}

main().catch((error) => {
  if (axios.isAxiosError(error)) {
    console.error('NCDB error:', error.response?.data ?? error.message)
  } else {
    console.error('Unexpected error:', error)
  }
  process.exit(1)
})
