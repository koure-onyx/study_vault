import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@studyvault/db/connect';
import Topic from '@studyvault/db/models/Topic';
import Chapter from '@studyvault/db/models/Chapter';
import Book from '@studyvault/db/models/Book';
import '@studyvault/db/models/Board';

const TopicModel = Topic as any;
const ChapterModel = Chapter as any;
const BookModel = Book as any;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subjectSlug: string; chapterSlug: string; topicSlug: string }> }
) {
  try {
    await connectDB();

    const { subjectSlug, chapterSlug, topicSlug } = await params;

    const book = await BookModel.findOne({ subject_slug: subjectSlug })
      .populate('program_id', 'name slug')
      .populate('board_id', 'name short_code slug')
      .lean();

    if (!book) {
      return NextResponse.json({ success: false, error: 'Book not found' }, { status: 404 });
    }

    const chapter = await ChapterModel.findOne({
      book_id: book._id,
      $or: [
        { slug: chapterSlug },
        { chapter_number: parseInt(String(chapterSlug).replace(/^chapter-/i, ''), 10) },
      ],
    }).lean();

    if (!chapter) {
      return NextResponse.json({ success: false, error: 'Chapter not found' }, { status: 404 });
    }

    const topic = await TopicModel.findOne({
      slug: params.topicSlug,
      chapter_id: chapter._id,
      book_id: book._id,
    })
      .populate('chapter_id', 'title chapter_number slug')
      .populate('book_id', 'title subject subject_slug slug edition_year seo')
      .populate('program_id', 'name slug')
      .populate('board_id', 'name short_code slug')
      .lean();

    if (!topic) {
      return NextResponse.json({ success: false, error: 'Topic not found' }, { status: 404 });
    }

    const isPreview = request.nextUrl.searchParams.get('preview') === 'true';
    if (!topic.is_live && !isPreview) {
      return NextResponse.json({ success: false, error: 'Topic not published yet' }, { status: 403 });
    }

    const chapters = await ChapterModel.find({ book_id: book._id })
      .sort({ chapter_number: 1 })
      .select('_id title chapter_number slug')
      .lean();

    let previousTopic = await TopicModel.findOne({
      chapter_id: chapter._id,
      display_order: { $lt: topic.display_order },
      is_live: true,
    })
      .sort({ display_order: -1 })
      .select('_id title slug display_order')
      .lean();

    let prevTopicChapterSlug = chapter.slug;

    if (!previousTopic) {
      const prevChapter = [...chapters]
        .sort((a, b) => b.display_order - a.display_order || b.chapter_number - a.chapter_number)
        .find((c) => c.display_order < chapter.display_order || c.chapter_number < chapter.chapter_number);

      if (prevChapter) {
        previousTopic = await TopicModel.findOne({
          chapter_id: prevChapter._id,
          is_live: true,
        })
          .sort({ display_order: -1 })
          .select('_id title slug display_order chapter_id')
          .lean();
        if (previousTopic) {
          prevTopicChapterSlug = prevChapter.slug;
        }
      }
    }

    let nextTopic = await TopicModel.findOne({
      chapter_id: chapter._id,
      display_order: { $gt: topic.display_order },
      is_live: true,
    })
      .sort({ display_order: 1 })
      .select('_id title slug display_order chapter_id')
      .lean();

    let nextTopicChapterSlug = chapter.slug;

    if (!nextTopic) {
      const nextChapter = [...chapters]
        .sort((a, b) => a.display_order - b.display_order || a.chapter_number - b.chapter_number)
        .find((c) => c.display_order > chapter.display_order || c.chapter_number > chapter.chapter_number);

      if (nextChapter) {
        nextTopic = await TopicModel.findOne({
          chapter_id: nextChapter._id,
          is_live: true,
        })
          .sort({ display_order: 1 })
          .select('_id title slug display_order chapter_id')
          .lean();
        if (nextTopic) {
          nextTopicChapterSlug = nextChapter.slug;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        topic,
        previousTopic: previousTopic
          ? { 
              _id: previousTopic._id?.toString(), 
              title: previousTopic.title, 
              slug: previousTopic.slug,
              chapterSlug: prevTopicChapterSlug
            }
          : null,
        nextTopic: nextTopic
          ? { 
              _id: nextTopic._id?.toString(), 
              title: nextTopic.title, 
              slug: nextTopic.slug,
              chapterSlug: nextTopicChapterSlug
            }
          : null,
        book,
        program: book.program_id,
        chapter,
        chapters,
      },
    });
  } catch (error) {
    console.error('Get topic by slug error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch topic',
      },
      { status: 500 }
    );
  }
}
