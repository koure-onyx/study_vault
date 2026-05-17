/**
 * Generate JSON-LD structured data for SEO
 * @param {Object} topic - Topic document
 * @returns {Object} JSON-LD structured data
 */
export function generateTopicJsonLd(topic) {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    "name": topic.title,
    "description": topic.seo?.meta_description || topic.raw_text?.substring(0, 160),
    "educationalLevel": topic.program_name || 'Grade 9-10',
    "teaches": topic.keywords || [],
    "inLanguage": topic.title_urdu ? ['en', 'ur'] : 'en',
    "isPartOf": {
      "@type": "Book",
      "name": `${topic.subject_name} - ${topic.chapter_title}`,
    },
    "about": {
      "@type": "Thing",
      "name": topic.subject_name,
    },
  };
}

/**
 * Generate JSON-LD for educational organization
 * @param {string} name - Organization name
 * @param {string} url - Website URL
 * @returns {Object} JSON-LD structured data
 */
export function generateOrganizationJsonLd(name, url) {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": name,
    "url": url,
    "logo": `${url}/logo.png`,
    "sameAs": [
      "https://www.facebook.com/studyvaultpk",
      "https://twitter.com/studyvaultpk",
      "https://www.instagram.com/studyvaultpk",
    ],
  };
}

/**
 * Generate JSON-LD for course
 * @param {Object} program - Program document
 * @param {string} url - Course URL
 * @returns {Object} JSON-LD structured data
 */
export function generateCourseJsonLd(program, url) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": program.name,
    "description": program.description || `Study ${program.name} for Pakistani board exams`,
    "provider": {
      "@type": "EducationalOrganization",
      "name": "StudyVault PK",
      "sameAs": "https://studyvault.pk",
    },
    "url": url,
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "online",
      "instructor": {
        "@type": "Organization",
        "name": "StudyVault PK",
      },
    },
  };
}
