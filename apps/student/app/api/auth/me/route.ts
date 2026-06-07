import { getAuthUser } from '@studyvault/lib/auth/getAuthUser';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return Response.json(
        { success: true, data: { user: null } },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      );
    }
    return Response.json(
      { success: true, data: { user } },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (err) {
    console.error('[auth/me]', err);
    return Response.json(
      { success: false, error: 'Server error' },
      { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  }
}
