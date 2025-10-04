export type PasswordStrengthLevel = 'weak' | 'fair' | 'good' | 'strong'

export function getPasswordStrength(password: string): PasswordStrengthLevel {
  let score = 0

  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[a-z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  if (score >= 5) return 'strong'
  if (score >= 4) return 'good'
  if (score >= 3) return 'fair'
  return 'weak'
}

export function getPasswordStrengthLabel(strength: PasswordStrengthLevel): string {
  switch (strength) {
    case 'strong':
      return 'Strong password'
    case 'good':
      return 'Good password'
    case 'fair':
      return 'Fair password'
    default:
      return 'Weak password'
  }
}
