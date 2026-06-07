import { NextRequest } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@studyvault/lib/auth/getAuthUser';
import connectDB from '@studyvault/db/connect';
import UserVault from '@studyvault/db/models/UserVault';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorizedResponse();

    await connectDB();
    const vaultItems = await UserVault.find({ user_id: user.id })
      .sort({ created_at: -1 })
      .lean();

    return Response.json({
      success: true,
      data: { items: vaultItems },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorizedResponse();

    const { topicId, chapterId, bookId } = await req.json();
    if (!topicId) {
      return Response.json({ success: false, error: 'topicId required' }, { status: 400 });
    }

    await connectDB();
    const existing = await UserVault.findOne({ user_id: user.id, topic_id: topicId });
    if (existing) {
      return Response.json({ success: false, error: 'Already in vault' }, { status: 409 });
    }

    const vaultItem = await UserVault.create({
      user_id: user.id,
      topic_id: topicId,
      chapter_id: chapterId,
      book_id: bookId,
    });

    return Response.json({
      success: true,
      data: { item: vaultItem },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
