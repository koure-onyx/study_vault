import connectDB from '@studyvault/db/connect';
import Book from '@studyvault/db/models/Book';
import Chapter from '@studyvault/db/models/Chapter';
import Topic from '@studyvault/db/models/Topic';
import Program from '@studyvault/db/models/Program';
import Board from '@studyvault/db/models/Board';

function pickSeo(entity) {
  if (!entity) return { title: '', description: '', keywords: [], ogImageUrl: '' };

  return {
    title: entity.seo?.meta_title || entity.title || '',
    description: entity.seo?.meta_description || entity.summary || entity.summary_urdu || '',
    keywords: entity.seo?.keywords || [],
    ogImageUrl: entity.seo?.og_image_url || entity.cover_image_url || '',
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildBoardMatcher(boardSlug) {
  const normalizedBoardSlug = String(boardSlug || '').trim().toLowerCase();
  const normalizedBoardName = normalizedBoardSlug.replace(/-/g, ' ');
  const isPunjabAlias =
    normalizedBoardSlug === 'pb' ||
    normalizedBoardSlug === 'punjab' ||
    normalizedBoardSlug === 'punjab-board' ||
    normalizedBoardName.includes('punjab');

  const matchers = [
    { slug: normalizedBoardSlug },
    { short_code: String(boardSlug || '').toUpperCase() },
    { name: new RegExp(`^${escapeRegex(normalizedBoardName)}$`, 'i') },
    { name: new RegExp(normalizedBoardName, 'i') },
  ];

  if (isPunjabAlias) {
    matchers.push(
      { province: /punjab/i },
      { slug: /punjab/i },
      { name: /punjab/i },
      { short_code: 'PB' }
    );
  }

  return { $or: matchers };
}

export async function getReaderSeoData({
  boardSlug,
  programSlug,
  subjectSlug,
  chapterSlug,
  topicSlug,
}) {
  await connectDB();

  const board = boardSlug
    ? await Board.findOne(buildBoardMatcher(boardSlug))
        .select('name slug short_code')
        .lean()
    : null;

  const program = programSlug
    ? await Program.findOne({
        $or: [
          { slug: programSlug.toLowerCase() },
          { slug: programSlug.toLowerCase().replace(/-/g, ' ') },
          { name: new RegExp(`^${programSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/-/g, ' ')}$`, 'i') },
          { name: new RegExp(`^${programSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        ],
      }).select('name slug').lean()
    : null;

  const bookQuery = {
    subject_slug: subjectSlug,
    ...(board?._id ? { board_id: board._id } : {}),
    ...(program?._id ? { program_id: program._id } : {}),
  };

  const book = await Book.findOne(bookQuery)
    .sort({ edition_year: -1 })
    .select('title slug subject subject_slug summary seo cover_image_url board_id program_id edition_year')
    .lean();

  if (!book) {
    return null;
  }

  if (!chapterSlug) {
    return {
      kind: 'book',
      board,
      program,
      book,
      chapter: null,
      topic: null,
      ...pickSeo(book),
    };
  }

  const chapter = await Chapter.findOne({ book_id: book._id, slug: chapterSlug })
    .select('title slug summary summary_urdu seo chapter_number display_order')
    .lean();

  if (!chapter) {
    return null;
  }

  if (!topicSlug) {
    return {
      kind: 'chapter',
      board,
      program,
      book,
      chapter,
      topic: null,
      ...pickSeo(chapter),
    };
  }

  const topic = await Topic.findOne({
    book_id: book._id,
    chapter_id: chapter._id,
    slug: topicSlug,
  })
    .select('title slug seo raw_text')
    .lean();

  if (!topic) {
    return null;
  }

  return {
    kind: 'topic',
    board,
    program,
    book,
    chapter,
    topic,
    ...pickSeo(topic),
  };
}
