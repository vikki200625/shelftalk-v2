import { describe, it, expect } from 'vitest'
import { validatePassword } from './validate'

describe('validatePassword', () => {
  it('returns null for a valid password', () => {
    expect(validatePassword('Str0ng!Pass')).toBeNull()
  })

  it('rejects password shorter than 8 characters', () => {
    expect(validatePassword('Ab1!')).toBe('Password must be at least 8 characters')
  })

  it('rejects password without a number', () => {
    expect(validatePassword('StrongPass!')).toBe('Password must contain at least 1 number')
  })

  it('rejects password without a special character', () => {
    expect(validatePassword('Strong1Pass')).toBe('Password must contain at least 1 special character')
  })

  it('accepts exactly 8 characters with number and special', () => {
    expect(validatePassword('Abcdef1!')).toBeNull()
  })

  it('rejects empty string', () => {
    expect(validatePassword('')).toBe('Password must be at least 8 characters')
  })

  it('accepts special characters beyond basic set', () => {
    expect(validatePassword('Test1234#')).toBeNull()
    expect(validatePassword('Test1234@')).toBeNull()
    expect(validatePassword('Test1234$')).toBeNull()
  })

  it('allows very long passwords', () => {
    const long = 'A'.repeat(200) + '1!'
    expect(validatePassword(long)).toBeNull()
  })
})
