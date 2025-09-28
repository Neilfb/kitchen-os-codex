const requiredVars = ['NCDB_API_KEY', 'NCDB_SECRET', 'NCDB_INSTANCE']

const missing = requiredVars.filter((key) => !process.env[key])

if (missing.length > 0) {
  console.error('Missing environment variables:', missing.join(', '))
  process.exit(1)
}

console.log('All required environment variables are set.')
