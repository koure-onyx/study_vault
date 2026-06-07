import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'
import connectDB from '@studyvault/db/connect'
import User from '@studyvault/db/models/User'
import jwt from 'jsonwebtoken'
import { createAuthOptions } from './options'

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
 * Tries NextAuth session first, falls back to sv_token cookie.
 * Returns null if not authenticated.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    // Try 1: NextAuth session (primary method)
    const session = await getServerSession(createAuthOptions())
    
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
    
    // Try 2: sv_token cookie (fallback for legacy sessions)
    const cookieStore = await cookies()
    const svToken = cookieStore.get('sv_token')?.value
    
    if (svToken) {
      try {
        const decoded = jwt.verify(
          svToken,
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
        // Invalid token, continue to return null
      }
    }
    
    return null
  } catch (error) {
    console.error('getAuthUser error:', error)
    return null
  }
}

/**
 * Requires authentication - throws 401 if not authenticated.
 * Use this in API routes that require auth.
 */
export async function requireAuthUser(): Promise<AuthUser> {
  const user = await getAuthUser()
  
  if (!user) {
    throw new Error('Unauthorized')
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
