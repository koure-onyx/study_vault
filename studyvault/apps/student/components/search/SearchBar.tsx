'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SearchResult {
  _id: string;
  type: 'topic' | 'chapter' | 'formula';
  title: string;
  breadcrumb: string;
  exam_stat?: string;
  is_hot_topic?: boolean;
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchTopics();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  async function searchTopics() {
    try {
      setLoading(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data.data || []);
      setIsOpen(true);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(result: SearchResult) {
    setIsOpen(false);
    setQuery('');
    // Navigation handled by parent or Link component
  }

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          placeholder="Search topics, chapters, formulas..."
          className="w-full px-5 py-4 pl-12 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all"
        />
        <svg
          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {loading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
        >
          <div className="max-h-96 overflow-y-auto">
            {results.map((result, idx) => (
              <a
                key={result._id}
                href={`/topics/${result._id}`}
                onClick={() => handleSelect(result)}
                className="block p-4 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-colors border-b border-gray-50 last:border-b-0"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{result.title}</h4>
                      {result.is_hot_topic && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                          🔥 Hot
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{result.breadcrumb}</p>
                    {result.exam_stat && (
                      <p className="text-xs text-emerald-600 font-medium mt-1">{result.exam_stat}</p>
                    )}
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg capitalize">
                    {result.type}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </motion.div>
      )}

      {isOpen && query.trim().length >= 2 && results.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center z-50"
        >
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-600 font-medium">No results found for "{query}"</p>
          <p className="text-sm text-gray-500 mt-1">Try different keywords or check spelling</p>
        </motion.div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
