const requiredVars = ['NCDB_API_KEY', 'NCDB_INSTANCE']

const hasSecret = Boolean(process.env.NCDB_SECRET_KEY || process.env.NCDB_SECRET)

const missing = requiredVars.filter((key) => !process.env[key])
if (!hasSecret) {
  missing.push('NCDB_SECRET_KEY')
}

if (missing.length > 0) {
  console.error('Missing environment variables:', missing.join(', '))
  process.exit(1)
}

console.log('All required environment variables are set.')
