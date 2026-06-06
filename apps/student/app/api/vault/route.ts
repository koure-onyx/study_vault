import { NextRequest } from 'next/server';
import { requireAuth } from '@studyvault/lib/auth/middleware';
import connectDB from '@studyvault/db/connect';
import UserVault from '@studyvault/db/models/UserVault';
import '@studyvault/db/models/Topic';

// GET — fetch user's vault items (optionally filtered by topicId or type)
export async function GET(req: NextRequest) {
  try {
    const decoded = await requireAuth(req);
    if (!decoded) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Extract userId robustly from token payload
    const userId = decoded.userId || decoded.sub || decoded.id || decoded._id;
    if (!userId) {
      return Response.json({ error: 'Invalid token: user ID not found' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get('topicId');
    const type = searchParams.get('type');
    const programId = searchParams.get('programId');

    await connectDB();
    const filter: Record<string, unknown> = { user_id: userId };
    if (topicId) filter.topic_id = topicId;
    if (type) filter.type = type;
    if (programId) filter.program_id = programId;

    const items = await UserVault.find(filter)
      .sort({ createdAt: -1 })
      .populate('topic_id', 'title slug seo program_name subject_name chapter_title')
      .lean();

    return Response.json({ success: true, data: { items } });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// POST — create a vault item
export async function POST(req: NextRequest) {
  try {
    const decoded = await requireAuth(req);
    if (!decoded) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Extract userId robustly from token payload
    const userId = decoded.userId || decoded.sub || decoded.id || decoded._id;
    if (!userId) {
      return Response.json({ error: 'Invalid token: user ID not found' }, { status: 401 });
    }

    const body = await req.json();
    const { topicId, type, flashcard, video, highlight, note, chapterId, programId } = body;

    if (!topicId || !type)
      return Response.json({ success: false, error: 'topicId and type required' }, { status: 400 });

    const validTypes = ['flashcard', 'video_link', 'bookmark', 'note', 'highlight'];
    if (!validTypes.includes(type))
      return Response.json({ success: false, error: `type must be one of: ${validTypes.join(', ')}` }, { status: 400 });

    await connectDB();
    const item = await UserVault.create({
      user_id: userId,
      topic_id: topicId,
      chapter_id: chapterId,
      program_id: programId,
      type,
      flashcard: type === 'flashcard' ? flashcard : undefined,
      video: type === 'video_link' ? video : undefined,
      highlight: type === 'highlight' ? highlight : undefined,
      note: type === 'note' ? note : undefined,
    });

    return Response.json({ success: true, data: { item } }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    const msg = err instanceof Error ? err.message : 'Server error';
    return Response.json({ success: false, error: msg }, { status: 500 });
  }
}
