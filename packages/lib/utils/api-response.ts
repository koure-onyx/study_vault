import { NextResponse } from 'next/server';

/**
 * Standardized API response helper for StudyVault Onyx
 * All API routes should use this format for consistency
 */

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  error?: never;
}

interface ApiErrorResponse {
  success: false;
  data?: never;
  error: string;
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create a standardized success response
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data },
    { status }
  );
}

/**
 * Create a standardized error response
 */
export function apiError(message: string, status = 400): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

/**
 * Create a 401 unauthorized response (matches getAuthUser pattern)
 */
export function unauthorizedResponse(): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    { success: false, error: 'Authentication required' },
    { status: 401 }
  );
}

export type { ApiResponse };
