import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import connectDB from '@studyvault/db/connect'
import User from '@studyvault/db/models/User'
import jwt from 'jsonwebtoken'
import { authOptions } from './options';
import { createAuthOptions } from './authOptions'

export interface AuthUser {
  id: string
  email: string
  name?: string
  role: 'student' | 'admin' | 'teacher'
  board?: string
  grade?: string
  class?: string
  onboardingComplete?: boolean
}

/**
 * Unified authentication function that works in both API routes and server components.
 * Tries Authorization header first, then sv_token cookie, then NextAuth session.
 * Returns null if not authenticated.
 * 
 * @param req - Optional NextRequest for API routes (needed for Authorization header)
 */
export async function getAuthUser(req?: NextRequest): Promise<AuthUser | null> {
  try {
    // Try 1: Authorization header (for API routes with Bearer token)
    let token: string | null = null
    if (req) {
      const authHeader = req.headers.get('authorization')
      token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    }

    // Try 2: sv_token cookie (fallback for legacy sessions or when no header)
    if (!token) {
      const cookieStore = await cookies()
      token = cookieStore.get('sv_token')?.value || null
    }

    // If we have a token, verify it and fetch user from DB
    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'
        ) as any

        if (decoded.userId || decoded.id) {
          await connectDB()
          const user = await User.findById(decoded.userId || decoded.id)
            .select('-password_hash -otp -password_reset_token')
            .lean()

          if (user) {
            return {
              id: user._id.toString(),
              email: user.email,
              name: user.name,
              role: user.role || 'student',
              board: user.student_profile?.board,
              grade: user.student_profile?.grade,
              class: user.student_profile?.class,
              onboardingComplete: user.student_profile?.onboarding_completed
            }
          }
        }
      } catch (jwtError) {
        // Invalid token, continue to try NextAuth session
      }
    }

    // Try 3: NextAuth session (primary method for browser sessions)
    const session = await getServerSession(authOptions)

    
    if (session?.user) {
      const sessionUser = session.user as any

      // If we have an ID from the session, fetch fresh user data
      const userId = sessionUser.id || sessionUser.userId

      if (userId) {
        await connectDB()
        const user = await User.findById(userId).select('-password_hash -otp -password_reset_token').lean()

        if (user) {
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role || 'student',
            board: user.student_profile?.board,
            grade: user.student_profile?.grade,
            class: user.student_profile?.class,
            onboardingComplete: user.student_profile?.onboarding_completed
          }
        }
      }

      // Fallback: use session data directly if DB lookup failed
      return {
        id: sessionUser.id || sessionUser.sub || '',
        email: sessionUser.email || '',
        name: sessionUser.name,
        role: sessionUser.role || 'student',
        board: sessionUser.board,
        grade: sessionUser.grade,
        class: sessionUser.class,
        onboardingComplete: sessionUser.onboardingComplete
      }
    }

    return null
  } catch (error) {
    console.error('getAuthUser error:', error)
    return null
  }
}

/**
 * Requires authentication - returns 401 response if not authenticated.
 * Use this in API routes that require auth.
 * 
 * @param req - NextRequest for API routes
 */
export async function requireAuthUser(req: NextRequest): Promise<AuthUser | Response> {
  const user = await getAuthUser(req)

  if (!user) {
    return Response.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return user
}

/**
 * Helper to create a standardized 401 response
 */
export function unauthorizedResponse(message = 'Unauthorized') {
  return Response.json(
    { success: false, error: message },
    { status: 401 }
  )
}
