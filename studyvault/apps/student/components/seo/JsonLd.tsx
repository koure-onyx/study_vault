'use client';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface TopicData {
  title: string;
  description: string;
  subject: string;
  grade: string;
  publishedAt: string;
  updatedAt: string;
  keywords: string[];
  thumbnail?: string;
  url: string;
  learningOutcomes?: string[];
  topics?: Array<{ title: string; url: string }>;
}

interface JsonLdProps {
  type?: 'LearningResource' | 'BreadcrumbList' | 'EducationalOrganization' | 'Course';
  data: TopicData | BreadcrumbItem[] | null;
}

export default function JsonLd({ type = 'LearningResource', data }: JsonLdProps) {
  let jsonLdObject: Record<string, any> = {};

  switch (type) {
    case 'LearningResource':
      if (!data || typeof data !== 'object') return null;
      
      jsonLdObject = {
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        name: (data as TopicData).title,
        description: (data as TopicData).description,
        about: (data as TopicData).subject,
        educationalLevel: (data as TopicData).grade,
        learningResourceType: 'Educational Website',
        audience: {
          '@type': 'EducationalAudience',
          educationalRole: 'student',
        },
        author: {
          '@type': 'Organization',
          name: 'StudyVault Pakistan',
          url: 'https://studyvault.pk',
        },
        publisher: {
          '@type': 'Organization',
          name: 'StudyVault Pakistan',
          logo: {
            '@type': 'ImageObject',
            url: 'https://studyvault.pk/logo.png',
          },
        },
        datePublished: (data as TopicData).publishedAt,
        dateModified: (data as TopicData).updatedAt,
        keywords: (data as TopicData).keywords?.join(', '),
        thumbnailUrl: (data as TopicData).thumbnail || 'https://studyvault.pk/og-image.jpg',
        url: (data as TopicData).url,
        image: (data as TopicData).thumbnail || 'https://studyvault.pk/og-image.jpg',
        teaches: (data as TopicData).learningOutcomes,
        hasPart: (data as TopicData).topics?.map((topic) => ({
          '@type': 'LearningResource',
          name: topic.title,
          url: topic.url,
        })),
        inLanguage: 'en-PK',
        typicalAgeRange: '14-16',
        isAccessibleForFree: true,
        accessibilityFeature: ['alternativeText', 'readingOrder'],
      };
      break;

    case 'BreadcrumbList':
      if (!Array.isArray(data)) return null;
      
      jsonLdObject = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: data.map((item: BreadcrumbItem, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      };
      break;

    case 'EducationalOrganization':
      jsonLdObject = {
        '@context': 'https://schema.org',
        '@type': 'EducationalOrganization',
        name: 'StudyVault Pakistan',
        alternateName: 'StudyVault PK',
        description: 'Pakistan\'s premier online learning platform for secondary education - FBISE, Lahore Board, and all Pakistani boards',
        url: 'https://studyvault.pk',
        logo: {
          '@type': 'ImageObject',
          url: 'https://studyvault.pk/logo.png',
          width: 600,
          height: 600,
        },
        foundingDate: '2024',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'PK',
          addressRegion: 'Punjab',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          email: 'info@studyvault.pk',
          availableLanguage: ['English', 'Urdu'],
        },
        sameAs: [
          'https://facebook.com/studyvaultpk',
          'https://twitter.com/studyvaultpk',
          'https://instagram.com/studyvaultpk',
          'https://youtube.com/@studyvaultpk',
        ],
        knowsAbout: [
          'Secondary Education',
          'FBISE Curriculum',
          'Board Exams',
          'Physics',
          'Chemistry',
          'Mathematics',
          'Biology',
        ],
      };
      break;

    case 'Course':
      if (!data || typeof data !== 'object') return null;
      
      jsonLdObject = {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: (data as TopicData).title,
        description: (data as TopicData).description,
        provider: {
          '@type': 'Organization',
          name: 'StudyVault Pakistan',
          sameAs: 'https://studyvault.pk',
        },
        educationalCredentialAwarded: 'Secondary School Certificate (SSC)',
        hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: 'Online',
          courseWorkload: 'PT30H',
        },
        totalHistoricalEnrollment: 10000,
        offers: {
          '@type': 'Offer',
          category: 'Paid',
          priceCurrency: 'PKR',
          price: '5000',
          availability: 'https://schema.org/InStock',
        },
      };
      break;

    default:
      return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdObject) }}
    />
  );
}
