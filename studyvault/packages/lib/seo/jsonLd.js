// packages/lib/seo/jsonLd.js

export function buildTopicJsonLd(topic) {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    "name": topic.title,
    "description": topic.seo?.meta_description || topic.raw_text?.substring(0, 160),
    "educationalLevel": topic.program_name || 'Grade 9-10',
    "inLanguage": topic.title_urdu ? ['en', 'ur'] : 'en',
    "isPartOf": {
      "@type": "Book",
      "name": topic.chapter_title,
      "chapter": topic.chapter_number
    },
    "about": topic.keywords || [],
    "hasPart": topic.content_blocks?.filter(b => b.type === 'formula').map(f => ({
      "@type": "MathSolver",
      "name": f.label || 'Formula',
      "text": f.latex || f.plain_text
    })) || [],
    "audience": {
      "@type": "EducationalAudience",
      "educationalRole": "student"
    },
    "typicalAgeRange": "14-16",
    "timeRequired": `PT${topic.estimated_read_time || 3}M`,
    "url": topic.seo?.canonical_url,
    "datePublished": topic.createdAt,
    "dateModified": topic.updatedAt
  };
}

export function buildBookJsonLd(book) {
  return {
    "@context": "https://schema.org",
    "@type": "Textbook",
    "name": book.title,
    "alternateName": book.subject,
    "bookEdition": book.edition_label,
    "datePublished": String(book.edition_year),
    "inLanguage": book.metadata?.language || 'en',
    "educationalLevel": book.metadata?.grade_level || 'Grade 9-10',
    "audience": {
      "@type": "EducationalAudience",
      "educationalRole": "student",
      "typicalAgeRange": "14-16"
    },
    "publisher": {
      "@type": "Organization",
      "name": book.metadata?.publisher || 'StudyVault PK'
    },
    "author": book.metadata?.authors?.map(author => ({
      "@type": "Person",
      "name": author
    })) || [],
    "numberOfPages": book.metadata?.total_pages,
    "isbn": book.metadata?.isbn,
    "url": book.seo?.canonical_url,
    "description": book.seo?.meta_description
  };
}

export function buildChapterJsonLd(chapter) {
  return {
    "@context": "https://schema.org",
    "@type": "Chapter",
    "name": chapter.title,
    "chapterNumber": chapter.chapter_number,
    "isPartOf": {
      "@type": "Book",
      "name": chapter.book_id // Would need to be populated with actual book title
    },
    "description": chapter.summary,
    "educationalLevel": chapter.program_name || 'Grade 9-10',
    "inLanguage": 'en',
    "url": chapter.seo?.canonical_url
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "StudyVault PK",
    "url": process.env.STUDENT_URL || 'https://study.domain.com',
    "logo": {
      "@type": "ImageObject",
      "url": "https://study.domain.com/logo.png"
    },
    "sameAs": [
      "https://facebook.com/studyvaultpk",
      "https://twitter.com/studyvaultpk",
      "https://instagram.com/studyvaultpk"
    ],
    "description": "Pakistan's premier textbook study platform for Grade 9-10 students preparing for board exams."
  };
}

export function buildCourseJsonLd(program) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": program.name,
    "description": program.description || `Complete ${program.name} curriculum for Pakistani board exams`,
    "provider": {
      "@type": "EducationalOrganization",
      "name": "StudyVault PK",
      "sameAs": process.env.STUDENT_URL || 'https://study.domain.com'
    },
    "educationalLevel": program.program_type === 'academic' ? 'Secondary Education' : 'Professional Development',
    "inLanguage": 'en',
    "url": `${process.env.STUDENT_URL}/${program.slug}`
  };
}
