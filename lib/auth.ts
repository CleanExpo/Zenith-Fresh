import { compare, hash } from 'bcryptjs'
import { sign, verify } from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
}

export function generateToken(payload: any): string {
  return sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): any {
  try {
    return verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export function getTokenFromCookies(): string | null {
  const cookieStore = cookies()
  return cookieStore.get('token')?.value || null
}

export function setTokenCookie(token: string) {
  cookies().set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export function removeTokenCookie() {
  cookies().delete('token')
} 