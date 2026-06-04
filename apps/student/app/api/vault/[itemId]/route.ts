import { NextRequest } from 'next/server';
import { requireAuth } from '@studyvault/lib/auth/middleware';
import connectDB from '@studyvault/db/connect';
import UserVault from '@studyvault/db/models/UserVault';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const { itemId } = await params;
    const user = await requireAuth(req);
    const updates = await req.json();
    await connectDB();

    const item = await UserVault.findOneAndUpdate(
      { _id: itemId, user_id: user._id }, // user_id check prevents editing others' items
      { $set: updates },
      { new: true }
    );

    if (!item) return Response.json({ success: false, error: 'Item not found' }, { status: 404 });
    return Response.json({ success: true, data: { item } });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const { itemId } = await params;
    const user = await requireAuth(req);
    await connectDB();

    const item = await UserVault.findOneAndDelete({ _id: itemId, user_id: user._id });
    if (!item) return Response.json({ success: false, error: 'Item not found' }, { status: 404 });

    return Response.json({ success: true, data: { message: 'Item deleted' } });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}