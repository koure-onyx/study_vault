'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface FlashcardCreatorProps {
  topicId: string;
  userId: string;
  onSuccess?: () => void;
}

export function FlashcardCreator({ topicId, userId, onSuccess }: FlashcardCreatorProps) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          topicId,
          type: 'flashcard',
          flashcard: {
            front,
            back,
            is_ai_generated: false,
          },
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save flashcard');
      }

      setSuccessMessage('Flashcard saved to your vault! 🎉');
      setFront('');
      setBack('');
      
      setTimeout(() => {
        setSuccessMessage(null);
        onSuccess?.();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-2xl p-6 border border-purple-200 dark:border-purple-800"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Create Flashcard</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Add custom flashcards to your vault</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Front Input */}
          <div>
            <label htmlFor="front" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Front (Question/Concept)
            </label>
            <textarea
              id="front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              rows={3}
              required
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-200"
              placeholder="e.g., What is the formula for velocity?"
            />
          </div>

          {/* Back Input */}
          <div>
            <label htmlFor="back" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Back (Answer/Definition)
            </label>
            <textarea
              id="back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              rows={3}
              required
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-200"
              placeholder="e.g., v = d/t (velocity = distance / time)"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">{successMessage}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSaving || !front.trim() || !back.trim()}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save to Vault
              </>
            )}
          </button>
        </form>

        {/* Tips */}
        <div className="mt-6 pt-6 border-t border-purple-200 dark:border-purple-800">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">💡 Tips for Great Flashcards</h4>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-1">•</span>
              Keep questions clear and focused on one concept
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-1">•</span>
              Use simple language that's easy to remember
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-1">•</span>
              Add formulas, definitions, or key facts
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-1">•</span>
              Review regularly for better retention
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
