import { NextRequest } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@studyvault/lib/auth/getAuthUser';
import connectDB from '@studyvault/db/connect';
import UserVault from '@studyvault/db/models/UserVault';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorizedResponse();

    const { itemId } = await params;
    await connectDB();

    const result = await UserVault.deleteOne({
      _id: itemId,
      user_id: user.id,
    });

    if (result.deletedCount === 0) {
      return Response.json({ success: false, error: 'Item not found in vault' }, { status: 404 });
    }

    return Response.json({
      success: true,
      data: { message: 'Removed from vault' },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
