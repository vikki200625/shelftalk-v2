/**
 * Password validation — 8+ chars, at least 1 number, at least 1 special character.
 * Returns null if valid, or an error message string.
 */
export function validatePassword(password) {
  if (password.length < 8) {
    return 'Password must be at least 8 characters'
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least 1 number'
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return 'Password must contain at least 1 special character'
  }
  return null
}
