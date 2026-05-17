import { getDb } from '@studyvault/db';
import type { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const db = await getDb();
    
    // Base URLs
    const sitemapUrls: MetadataRoute.Sitemap = [
      {
        url: 'https://studyvault.pk',
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1,
      },
      {
        url: 'https://studyvault.pk/dashboard',
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: 'https://studyvault.pk/pricing',
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
    ];

    // Get all programs
    const programs = await db.collection('programs').find({ is_active: true }).toArray();
    
    for (const program of programs) {
      sitemapUrls.push({
        url: `https://studyvault.pk/${program.slug}`,
        lastModified: new Date(program.updatedAt || program.createdAt),
        changeFrequency: 'weekly',
        priority: 0.9,
      });

      // Get books for this program
      const books = await db.collection('books').find({ 
        program_id: program._id,
        is_live: true 
      }).toArray();

      for (const book of books) {
        sitemapUrls.push({
          url: `https://studyvault.pk/${program.slug}/${book.subject_slug}`,
          lastModified: new Date(book.updatedAt || book.createdAt),
          changeFrequency: 'weekly',
          priority: 0.85,
        });

        // Get chapters for this book
        const chapters = await db.collection('chapters').find({ 
          book_id: book._id,
          is_live: true 
        }).sort({ display_order: 1 }).toArray();

        for (const chapter of chapters) {
          sitemapUrls.push({
            url: `https://studyvault.pk/${program.slug}/${book.subject_slug}/${chapter.slug}`,
            lastModified: new Date(chapter.updatedAt || chapter.createdAt),
            changeFrequency: 'weekly',
            priority: 0.75,
          });

          // Get topics for this chapter
          const topics = await db.collection('topics').find({ 
            chapter_id: chapter._id,
            is_live: true 
          }).sort({ display_order: 1 }).toArray();

          for (const topic of topics) {
            sitemapUrls.push({
              url: `https://studyvault.pk/${program.slug}/${book.subject_slug}/${chapter.slug}/${topic.slug}`,
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
    return [];
  }
}
