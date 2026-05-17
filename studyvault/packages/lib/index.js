// packages/lib/index.js - Central export file

// AI
export { generateCompletion } from './ai/provider.js';
export { PROMPTS } from './ai/prompts.js';

// Auth
export { generateToken, verifyToken, decodeToken } from './auth/jwt.js';
export { authMiddleware, requireAuth, requireRole } from './auth/middleware.js';

// Ingestion
export { ingestBook } from './ingestion/ingestBook.js';

// SEO
export {
  buildTopicJsonLd,
  buildBookJsonLd,
  buildChapterJsonLd,
  buildOrganizationJsonLd,
  buildCourseJsonLd
} from './seo/jsonLd.js';

// Utils
export {
  generateSlug,
  generateUniqueSlug,
  slugToTitle,
  validateSlug
} from './utils/slug.js';

export {
  computeHash,
  compareHash,
  generateShortHash,
  generateRandomToken,
  hashPassword
} from './utils/hash.js';

export {
  calculateProgress,
  getMasteryStatus,
  calculateXP,
  aggregateProgress,
  calculateStreak
} from './utils/progress.js';
