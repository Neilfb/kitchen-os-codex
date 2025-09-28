import dotenv from 'dotenv'
dotenv.config({ path: 'apps/allerq/.env.test' })
import axios from 'axios'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function main() {
  console.log('Running sign-up smoke test against:', BASE_URL)

  try {
    const response = await axios.post(`${BASE_URL}/api/auth/signup`, {
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'TestPassword123!',
    })

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`)
    }

    if (response.data?.status !== 'success') {
      throw new Error(`Expected response.data.status to be "success", got ${response.data?.status}`)
    }

    console.log('✅ Sign-up smoke test passed')
  } catch (error) {
    console.error('❌ Sign-up smoke test failed', error)
    process.exit(1)
  }
}

main()
