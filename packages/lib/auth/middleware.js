import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export async function requireAuth(req) {
  try {
    // Try Authorization header first
    const authHeader = req?.headers?.get('authorization')
    let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    // Fall back to cookie
    if (!token) {
      const cookieStore = await cookies()
      token = cookieStore.get('sv_token')?.value
    }

    if (!token) return null

    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.MONGODB_JWT_SECRET)
    return decoded
  } catch {
    return null
  }
}

export async function requireAdmin(req) {
  const user = await requireAuth(req)
  if (!user || user.role !== 'admin') return null
  return user
}
