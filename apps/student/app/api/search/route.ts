import { NextRequest } from 'next/server';
import connectDB from '@studyvault/db/connect';
import Book from '@studyvault/db/models/Book';
import Topic from '@studyvault/db/models/Topic';
import QuranVerse from '@studyvault/db/models/QuranVerse';
import '@studyvault/db/models/Program';
import '@studyvault/db/models/Chapter';
import { getServerUser } from '@studyvault/lib/auth/server';

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function regex(value: string) {
  return new RegExp(escapeRegex(value), 'i');
}

function quranBookFilter() {
  return {
    $or: [
      { slug: 'the-holy-quran' },
      { subject_slug: 'the-holy-quran' },
      { title: /quran/i },
      { subject: /quran/i },
    ],
  };
}

function scopedBookFilter(board?: string, grade?: string) {
  const base: Record<string, unknown> = { is_current_edition: { $ne: false } };
  const scopeParts: Record<string, unknown>[] = [base];

  if (board) {
    scopeParts.push({ $or: [{ board }, { 'metadata.board': board }] });
  }
  if (grade) {
    scopeParts.push({
      $or: [{ grade }, { 'metadata.grade': grade }, { 'metadata.grade_level': grade }],
    });
  }

  if (!board && !grade) return base;

  return {
    $or: [quranBookFilter(), { $and: scopeParts }],
  };
}

function gradeNumberFilter(n: number) {
  const patterns = [
    new RegExp(`^Grade ${n}$`, 'i'),
    new RegExp(`^Class ${n}$`, 'i'),
    new RegExp(`Grade ${n}`, 'i'),
    new RegExp(`Class ${n}`, 'i'),
    new RegExp(`\\b${n}\\b`),
  ];
  return {
    $or: [
      { grade: { $in: patterns } },
      { 'metadata.grade': { $in: patterns } },
      { 'metadata.grade_level': { $in: patterns } },
      { title: new RegExp(`Grade ${n}|Class ${n}`, 'i') },
    ],
  };
}

const SURAH_NAMES: Record<number, string> = {
  1: 'Al-Fatihah', 2: 'Al-Baqarah', 3: 'Ali Imran', 36: 'Ya-Sin', 67: 'Al-Mulk',
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';

    if (q.length < 1) {
      return Response.json({ success: false, error: 'Query is required' }, { status: 400 });
    }

    await connectDB();
    const user = await getServerUser();
    const board = user?.board || user?.student_profile?.board || undefined;
    const grade = user?.grade || user?.student_profile?.grade || undefined;
    const isLoggedIn = Boolean(user);

    const books: unknown[] = [];
    const topics: unknown[] = [];
    const quran: unknown[] = [];

    const isNumeric = /^\d{1,2}$/.test(q);
    const gradeNum = isNumeric ? parseInt(q, 10) : null;

    if (gradeNum && gradeNum >= 1 && gradeNum <= 12) {
      const gradeScope = scopedBookFilter(isLoggedIn ? board : undefined, isLoggedIn ? grade : undefined);
      let gradeBooks = await (Book as any)
        .find({ $and: [{ is_live: true }, gradeScope, gradeNumberFilter(gradeNum)] })
        .limit(10)
        .populate('program_id', 'name slug')
        .populate('board_id', 'name short_code slug')
        .select('title slug subject subject_slug program_id board_id board grade description seo')
        .lean();

      if (gradeBooks.length === 0) {
        gradeBooks = await (Book as any)
          .find({
            $and: [
              gradeScope,
              {
                $or: [
                  { grade: new RegExp(`${gradeNum}`, 'i') },
                  { 'metadata.grade': new RegExp(`${gradeNum}`, 'i') },
                  { 'metadata.grade_level': new RegExp(`${gradeNum}`, 'i') },
                  { title: new RegExp(`Grade ${gradeNum}|Class ${gradeNum}`, 'i') },
                ],
              },
            ],
          })
          .limit(10)
          .populate('program_id', 'name slug')
          .populate('board_id', 'name short_code slug')
          .select('title slug subject subject_slug program_id board_id board grade description seo')
          .lean();
      }

      books.push(...gradeBooks);
    }

    const search = regex(q);
    const textBookFilter: Record<string, unknown> = {
      is_current_edition: { $ne: false },
      $or: [
        { title: search },
        { subject: search },
        { board: search },
        { grade: search },
        { slug: search },
        { 'seo.meta_description': search },
        { 'metadata.grade_level': search },
      ],
    };

    if (isLoggedIn && (board || grade)) {
      const scoped = scopedBookFilter(board, grade);
      textBookFilter.$and = [scoped];
    }

    const textBooks = await (Book as any)
      .find(textBookFilter)
      .limit(10)
      .populate('program_id', 'name slug')
      .populate('board_id', 'name short_code slug')
      .select('title slug subject subject_slug program_id board_id board grade description seo')
      .lean();

    const seenBookIds = new Set(books.map((b: any) => b._id.toString()));
    for (const book of textBooks) {
      const id = (book as any)._id.toString();
      if (!seenBookIds.has(id) && books.length < 10) {
        seenBookIds.add(id);
        books.push(book);
      }
    }

    const topicFilter: Record<string, unknown> = {
      $or: [
        { title: search },
        { raw_text: search },
        { 'seo.meta_description': search },
        { 'content_blocks.text': search },
        { 'content_blocks.question': search },
        { 'content_blocks.definition': search },
      ],
    };

    if (isLoggedIn && (board || grade)) {
      const matchingBooks = await (Book as any).find(scopedBookFilter(board, grade)).select('_id').lean();
      topicFilter.book_id = { $in: matchingBooks.map((book: any) => book._id) };
    }

    const textTopics = await (Topic as any)
      .find(topicFilter)
      .limit(15)
      .populate({
        path: 'book_id',
        select: 'subject subject_slug board grade board_id program_id',
        populate: [
          { path: 'board_id', select: 'name short_code slug' },
          { path: 'program_id', select: 'name slug' },
        ],
      })
      .populate('program_id', 'name slug')
      .populate('chapter_id', 'chapter_number title slug')
      .select('title slug subject_name chapter_number quran_reference book_id program_id chapter_id')
      .lean();

    const seenTopicIds = new Set(topics.map((t: any) => t._id.toString()));
    for (const topic of textTopics) {
      const id = (topic as any)._id.toString();
      if (!seenTopicIds.has(id) && topics.length < 15) {
        seenTopicIds.add(id);
        topics.push(topic);
      }
    }

    const quranQuery = search;
    const quranTopicFilter: Record<string, unknown> = {
      is_live: true,
      $or: [
        { quran_reference: { $ne: null } },
        { 'content_blocks.type': 'quran_verse' },
        { title: quranQuery },
        { subject_name: quranQuery },
      ],
    };

    if (/quran/i.test(q)) {
      const quranTopics = await (Topic as any)
        .find(quranTopicFilter)
        .limit(5)
        .populate({
          path: 'book_id',
          select: 'title subject_slug board_id program_id',
          populate: [
            { path: 'board_id', select: 'name short_code slug' },
            { path: 'program_id', select: 'slug' },
          ],
        })
        .populate('program_id', 'slug')
        .populate('chapter_id', 'chapter_number slug')
        .select('title slug quran_reference book_id program_id chapter_id')
        .lean();

      for (const topic of quranTopics) {
        if (quran.length >= 5) break;
        quran.push({
          _id: (topic as any)._id,
          title: (topic as any).title,
          subtitle: (topic as any).quran_reference?.surah_name_english
            || `Surah ${(topic as any).quran_reference?.surah || ''}`,
          slug: (topic as any).slug,
          program_id: (topic as any).program_id,
          book_id: (topic as any).book_id,
          chapter_id: (topic as any).chapter_id,
          type: 'topic',
        });
      }
    }

    if (gradeNum && gradeNum >= 1 && gradeNum <= 114) {
      const verses = await (QuranVerse as any)
        .find({ surah: gradeNum })
        .limit(5)
        .select('surah ayah text_uthmani')
        .lean();

      for (const verse of verses) {
        if (quran.length >= 5) break;
        quran.push({
          _id: `${verse.surah}-${verse.ayah}`,
          title: `Surah ${verse.surah}, Ayah ${verse.ayah}`,
          subtitle: SURAH_NAMES[verse.surah] || `Surah ${verse.surah}`,
          surah: verse.surah,
          ayah: verse.ayah,
          type: 'verse',
        });
      }
    }

    return Response.json({
      success: true,
      data: {
        books: books.slice(0, 10),
        topics: topics.slice(0, 15),
        quran: quran.slice(0, 5),
        query: q,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return Response.json({ success: false, error: msg }, { status: 500 });
  }
}
