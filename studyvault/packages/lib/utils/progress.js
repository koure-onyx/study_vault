// packages/lib/utils/progress.js

/**
 * Calculate weighted progress: 70% quiz + 30% reading
 * @param {Object} params
 * @param {number} params.quizScore - Quiz score (0-100)
 * @param {boolean} params.isRead - Whether topic has been read
 * @param {number} params.scrollDepth - Scroll depth percentage (0-100)
 * @returns {number} Progress percentage (0-100)
 */
export function calculateProgress({ quizScore = 0, isRead = false, scrollDepth = 0 }) {
  const quizWeight = 0.7;
  const readingWeight = 0.3;
  
  // Reading component: only counts if marked as read, scaled by scroll depth
  const readingComponent = isRead ? Math.min(scrollDepth, 100) : 0;
  
  // Final progress calculation
  const progress = (quizWeight * quizScore) + (readingWeight * (readingComponent / 100) * 100);
  
  return Math.round(Math.min(progress, 100));
}

/**
 * Determine mastery status based on progress and quiz performance
 * @param {number} progressPercent 
 * @param {number} quizScore 
 * @returns {'locked' | 'in_progress' | 'mastered'}
 */
export function getMasteryStatus(progressPercent, quizScore = 0) {
  if (progressPercent === 0 && quizScore === 0) {
    return 'locked';
  }
  
  if (quizScore >= 80 && progressPercent >= 70) {
    return 'mastered';
  }
  
  return 'in_progress';
}

/**
 * Calculate XP earned for completing a topic
 * @param {Object} params
 * @param {number} params.progressPercent - Final progress percentage
 * @param {number} params.quizScore - Quiz score (0-100)
 * @param {string} params.difficulty - Topic difficulty (easy/medium/hard)
 * @returns {number} XP earned
 */
export function calculateXP({ progressPercent, quizScore = 0, difficulty = 'medium' }) {
  const baseXP = 10;
  
  // Difficulty multiplier
  const difficultyMultipliers = {
    easy: 1.0,
    medium: 1.5,
    hard: 2.0
  };
  
  const multiplier = difficultyMultipliers[difficulty] || 1.0;
  
  // Bonus for perfect quiz
  const quizBonus = quizScore === 100 ? 5 : 0;
  
  // Only award XP if progress > 0
  if (progressPercent <= 0) return 0;
  
  const xp = Math.round((baseXP * multiplier) + quizBonus);
  return xp;
}

/**
 * Aggregate progress across multiple topics
 * @param {Array} topics - Array of topic progress objects
 * @returns {number} Overall progress percentage
 */
export function aggregateProgress(topics) {
  if (!topics || topics.length === 0) return 0;
  
  const totalProgress = topics.reduce((sum, topic) => sum + (topic.progress_percent || 0), 0);
  return Math.round(totalProgress / topics.length);
}

/**
 * Calculate streak days from last active date
 * @param {Date} lastActive 
 * @param {number} currentStreak 
 * @returns {number} Updated streak days
 */
export function calculateStreak(lastActive, currentStreak = 0) {
  if (!lastActive) return 0;
  
  const now = new Date();
  const last = new Date(lastActive);
  const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
  
  // If last active within 24 hours, streak continues
  if (diffDays === 0) {
    return currentStreak;
  }
  
  // If last active yesterday (1 day ago), increment streak
  if (diffDays === 1) {
    return currentStreak + 1;
  }
  
  // Streak broken
  return 0;
}
