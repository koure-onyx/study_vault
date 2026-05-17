import { getDb } from '@studyvault/db';
import type { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const db = await getDb();
    
    // Base URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://studyvault.pk';
    
    const sitemapUrls: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1,
      },
      {
        url: `${baseUrl}/dashboard`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/pricing`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      },
    ];

    // Fetch Programs
    const programsCollection = db.collection('programs');
    const programs = await programsCollection.find({ is_active: true }).toArray();

    for (const program of programs) {
      sitemapUrls.push({
        url: `${baseUrl}/${program.slug}`,
        lastModified: new Date(program.updatedAt || program.createdAt),
        changeFrequency: 'weekly',
        priority: 0.85,
      });

      // Fetch Books/Subjects for this program
      const booksCollection = db.collection('books');
      const books = await booksCollection.find({ 
        program_id: program._id,
        is_live: true 
      }).toArray();

      for (const book of books) {
        sitemapUrls.push({
          url: `${baseUrl}/${program.slug}/${book.subject_slug}`,
          lastModified: new Date(book.updatedAt || book.createdAt),
          changeFrequency: 'weekly',
          priority: 0.8,
        });

        // Fetch Chapters
        const chaptersCollection = db.collection('chapters');
        const chapters = await chaptersCollection.find({ 
          book_id: book._id,
          is_live: true 
        }).sort({ display_order: 1 }).toArray();

        for (const chapter of chapters) {
          sitemapUrls.push({
            url: `${baseUrl}/${program.slug}/${book.subject_slug}/${chapter.slug}`,
            lastModified: new Date(chapter.updatedAt || chapter.createdAt),
            changeFrequency: 'weekly',
            priority: 0.75,
          });

          // Fetch Topics
          const topicsCollection = db.collection('topics');
          const topics = await topicsCollection.find({ 
            chapter_id: chapter._id,
            is_live: true 
          }).sort({ display_order: 1 }).toArray();

          for (const topic of topics) {
            sitemapUrls.push({
              url: `${baseUrl}/${program.slug}/${book.subject_slug}/${chapter.slug}/${topic.slug}`,
              lastModified: new Date(topic.updatedAt || topic.createdAt),
              changeFrequency: 'daily',
              priority: 0.9,
            });
          }
        }
      }
    }

    return sitemapUrls;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return base sitemap even if DB fails
    return [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'https://studyvault.pk',
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1,
      },
    ];
  }
}
