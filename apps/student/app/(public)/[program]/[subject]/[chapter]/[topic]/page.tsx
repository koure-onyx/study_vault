import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import connectDB from '@studyvault/db/connect';
import Topic from '@studyvault/db/models/Topic';
import Chapter from '@studyvault/db/models/Chapter';
import Book from '@studyvault/db/models/Book';
import TopicReaderClient from './TopicReaderClient';

interface PageProps {
  params: {
    program: string;
    subject: string;
    chapter: string;
    topic: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    await connectDB();
    
    const topic = await Topic.findOne({ slug: params.topic })
      .populate('chapter_id', 'title')
      .populate('book_id', 'title subject');

    if (!topic) {
      return {
        title: 'Topic Not Found - StudyVault',
      };
    }

    return {
      title: `${topic.title} | ${topic.program_name || 'StudyVault'}`,
      description: topic.seo?.meta_description || `Learn ${topic.title} from ${topic.subject_name}`,
      keywords: topic.keywords?.join(', ') || topic.seo?.keywords?.join(', '),
      openGraph: {
        title: topic.title,
        description: topic.seo?.meta_description,
        images: topic.seo?.og_image_url ? [{ url: topic.seo.og_image_url }] : undefined,
      },
    };
  } catch (error) {
    return {
      title: 'Topic - StudyVault',
    };
  }
}

export default async function TopicPage({ params }: PageProps) {
  try {
    await connectDB();

    // Find topic by slug - try multiple approaches
    let topic = await Topic.findOne({ 
      slug: params.topic,
      is_live: true 
    })
      .populate('chapter_id', 'title chapter_number slug')
      .populate('book_id', 'title subject slug edition_year')
      .populate('program_id', 'name slug color_hex')
      .populate('board_id', 'name short_code')
      .lean();

    if (!topic) {
      // Try finding without is_live filter for preview mode
      topic = await Topic.findOne({ slug: params.topic })
        .populate('chapter_id', 'title chapter_number slug')
        .populate('book_id', 'title subject slug edition_year')
        .populate('program_id', 'name slug color_hex')
        .populate('board_id', 'name short_code')
        .lean();

      if (!topic) {
        notFound();
      }
    }

    // Get adjacent topics for navigation
    const previousTopic = await Topic.findOne({
      chapter_id: topic.chapter_id._id,
      display_order: { $lt: topic.display_order },
      is_live: true,
    })
      .sort({ display_order: -1 })
      .select('_id title slug')
      .lean();

    const nextTopic = await Topic.findOne({
      chapter_id: topic.chapter_id._id,
      display_order: { $gt: topic.display_order },
      is_live: true,
    })
      .sort({ display_order: 1 })
      .select('_id title slug')
      .lean();

    // Check for hot topic status
    const isHotTopic = topic.exam_frequency?.some((ef: any) => ef.is_hot_topic) || false;
    const examAppearances = topic.exam_frequency?.reduce((sum: number, ef: any) => sum + (ef.total_appearances || 0), 0) || 0;

    return (
      <TopicReaderClient
        topic={topic}
        previousTopic={previousTopic}
        nextTopic={nextTopic}
        isHotTopic={isHotTopic}
        examAppearances={examAppearances}
      />
    );
  } catch (error) {
    console.error('Topic page error:', error);
    notFound();
  }
}
