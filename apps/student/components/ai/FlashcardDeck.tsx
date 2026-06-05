'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Flashcard {
  _id?: string;
  front: string;
  back: string;
  is_ai_generated?: boolean;
}

interface FlashcardDeckProps {
  topicId: string;
  userId: string;
  initialCards?: Flashcard[];
}

export function FlashcardDeck({ topicId, userId, initialCards = [] }: FlashcardDeckProps) {
  const [cards, setCards] = useState<Flashcard[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [mode, setMode] = useState<'study' | 'shuffle' | 'review'>('study');

  // If no cards provided, they can generate AI flashcards or add manually
  const hasCards = cards.length > 0;

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setShowAnswer(false);
    
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Completed the deck
      setCompletedCount(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setShowAnswer(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    setShowAnswer(!showAnswer);
  };

  const markAsMastered = async () => {
    // TODO: Save to UserVault as mastered flashcard
    console.log('Marking card as mastered:', currentCard);
    handleNext();
  };

  const markAsNeedsReview = async () => {
    // TODO: Save to UserVault for spaced repetition
    console.log('Marking card for review:', currentCard);
    handleNext();
  };

  if (!hasCards) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-card rounded-2xl p-8 border text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">No Flashcards Yet</h3>
          <p className="text-text-muted mb-6">
            Generate AI flashcards for this topic or create your own manually.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate with AI
            </button>
            <button className="px-6 py-3 bg-background hover:bg-accent text-text-primary font-semibold rounded-xl border transition-all duration-200 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Manual
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Deck Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-text-primary text-lg">Flashcards</h3>
          <p className="text-sm text-text-muted">
            Card {currentIndex + 1} of {cards.length}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('study')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              mode === 'study'
                ? 'bg-accent text-text-primary'
                : 'bg-secondary text-text-muted'
            }`}
          >
            Study
          </button>
          <button
            onClick={() => setMode('shuffle')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              mode === 'shuffle'
                ? 'bg-accent text-text-primary'
                : 'bg-secondary text-text-muted'
            }`}
          >
            Shuffle
          </button>
          <button
            onClick={() => setMode('review')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              mode === 'review'
                ? 'bg-accent text-text-primary'
                : 'bg-secondary text-text-muted'
            }`}
          >
            Review
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, rotateY: 90 }}
          animate={{ opacity: 1, rotateY: 0 }}
          exit={{ opacity: 0, rotateY: -90 }}
          transition={{ duration: 0.3 }}
          className="perspective-1000 mb-6"
        >
          <div
            onClick={handleFlip}
            className="relative w-full h-64 cursor-pointer preserve-3d transition-transform duration-500"
            style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 backface-hidden bg-card rounded-2xl p-8 border-2 shadow-xl flex flex-col items-center justify-center text-center"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <span className="text-xs font-medium text-primary uppercase tracking-wide mb-4">
                Question
              </span>
              <p className="text-xl font-semibold text-text-primary leading-relaxed">
                {currentCard.front}
              </p>
              <p className="text-sm text-text-muted mt-6">
                Tap to reveal answer
              </p>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 backface-hidden bg-primary rounded-2xl p-8 border-2 shadow-xl flex flex-col items-center justify-center text-center rotate-y-180"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <span className="text-xs font-medium text-white/80 uppercase tracking-wide mb-4">
                Answer
              </span>
              <p className="text-xl font-semibold text-white leading-relaxed">
                {currentCard.back}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-4 py-3 bg-card hover:bg-accent text-text-primary font-medium rounded-xl border disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={markAsNeedsReview}
            className="px-4 py-3 bg-accent hover:bg-accent/80 text-text-primary font-medium rounded-xl transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Review Later
          </button>
          <button
            onClick={markAsMastered}
            className="px-4 py-3 bg-green-100 hover:bg-green-200 text-green-700 font-medium rounded-xl transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Got It!
          </button>
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className="px-4 py-3 bg-card hover:bg-accent text-text-primary font-medium rounded-xl border disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
        >
          Next
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Completion Message */}
      {completedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-accent rounded-xl border text-center"
        >
          <p className="text-green-800 font-semibold">
            🎉 Great job! You've completed this deck {completedCount} time{completedCount > 1 ? 's' : ''}.
          </p>
        </motion.div>
      )}
    </div>
  );
}
