import 'server-only'

import { getRequiredServerEnv } from '@/lib/env'

export const NCDB_API_KEY = getRequiredServerEnv('NCDB_API_KEY')
export const NCDB_INSTANCE = getRequiredServerEnv('NCDB_INSTANCE')
export const NCDB_SECRET = getRequiredServerEnv('NCDB_SECRET_KEY')
