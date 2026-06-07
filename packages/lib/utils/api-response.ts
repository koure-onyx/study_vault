import { NextResponse } from 'next/server';

/**
 * Standardized API Response Helpers for StudyVault Onyx
 * Format: { success: boolean, data?: any, error?: string }
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, message?: string) {
  return NextResponse.json<ApiResponse<T>>({
    success: true,
    data,
    ...(message && { message }),
  });
}

/**
 * Error response helper
 */
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json<ApiResponse>({
    success: false,
    error: message,
  }, { status });
}

/**
 * Unauthorized response helper (401)
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
  return errorResponse(message, 401);
}

/**
 * Normalize slug for consistent matching
 * Handles undefined/null safely
 */
export function normalizeSlug(slug: string | undefined | null): string {
  if (!slug) return '';
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')      // Remove special characters
    .replace(/\s+/g, '-')              // Replace spaces with hyphens
    .replace(/-+/g, '-')               // Collapse multiple hyphens
    .trim();
}