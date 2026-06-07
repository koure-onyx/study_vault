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

export async function getReaderSeoData({
  boardSlug,
  programSlug,
  subjectSlug,
  chapterSlug,
  topicSlug,
}) {
  await connectDB();

  const normalizedBoardSlug = String(boardSlug || '').trim().toLowerCase().replace(/-/g, ' ');
  const board = boardSlug
    ? await Board.findOne({
        $or: [
          { slug: boardSlug.toLowerCase() },
          { short_code: boardSlug.toUpperCase() },
          { name: new RegExp(`^${normalizedBoardSlug}$`, 'i') },
          { name: new RegExp(normalizedBoardSlug, 'i') },
        ],
      })
        .select('name slug short_code')
        .lean()
    : null;

  const program = programSlug
    ? await Program.findOne({ slug: programSlug }).select('name slug').lean()
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
