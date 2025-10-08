const MIN_LENGTH = 6
const MAX_LENGTH = 64

const LOWERCASE_REGEX = /[a-z]/
const UPPERCASE_REGEX = /[A-Z]/
const NUMBER_REGEX = /[0-9]/
const SYMBOL_REGEX = /[^A-Za-z0-9]/

export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required.'
  }

  if (password.length < MIN_LENGTH) {
    return `Password must be at least ${MIN_LENGTH} characters long.`
  }

  if (password.length > MAX_LENGTH) {
    return `Password must be at most ${MAX_LENGTH} characters long.`
  }

  if (!LOWERCASE_REGEX.test(password)) {
    return 'Password must include at least one lowercase letter.'
  }

  if (!UPPERCASE_REGEX.test(password)) {
    return 'Password must include at least one uppercase letter.'
  }

  if (!NUMBER_REGEX.test(password)) {
    return 'Password must include at least one number.'
  }

  if (!SYMBOL_REGEX.test(password)) {
    return 'Password must include at least one symbol.'
  }

  return null
}
