export type AuthErrorCode = 'TOKEN_MISSING' | 'TOKEN_INVALID' | 'TOKEN_EXPIRED' | 'ROLE_FORBIDDEN'

export class AuthTokenError extends Error {
  status: number
  code: AuthErrorCode

  constructor(message: string, status: number, code: AuthErrorCode) {
    super(message)
    this.name = 'AuthTokenError'
    this.status = status
    this.code = code
  }
}

