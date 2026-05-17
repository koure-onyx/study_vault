/**
 * Calculate weighted progress percent
 * Formula: 70% quiz score + 30% reading completion
 * @param {number} quizScore - Quiz score (0-100)
 * @param {boolean} isRead - Whether topic has been read
 * @returns {number} Progress percentage (0-100)
 */
export function calculateProgressPercent(quizScore, isRead) {
  const quizComponent = (quizScore || 0) * 0.7;
  const readingComponent = isRead ? 30 : 0;
  return Math.min(100, Math.round(quizComponent + readingComponent));
}

/**
 * Determine mastery status based on progress
 * @param {number} progressPercent - Current progress percentage
 * @returns {'locked' | 'in_progress' | 'mastered'}
 */
export function getMasteryStatus(progressPercent) {
  if (progressPercent >= 80) return 'mastered';
  if (progressPercent > 0) return 'in_progress';
  return 'locked';
}

/**
 * Calculate XP earned for completing a topic
 * @param {number} quizScore - Quiz score (0-100)
 * @param {boolean} isRead - Whether topic was read
 * @param {string} difficulty - Topic difficulty
 * @returns {number} XP points
 */
export function calculateXPEarned(quizScore, isRead, difficulty = 'medium') {
  const difficultyMultipliers = {
    easy: 1,
    medium: 1.5,
    hard: 2,
  };
  
  const baseXP = 10;
  const quizBonus = Math.floor((quizScore || 0) / 10);
  const readingBonus = isRead ? 5 : 0;
  const multiplier = difficultyMultipliers[difficulty] || 1;
  
  return Math.round((baseXP + quizBonus + readingBonus) * multiplier);
}
