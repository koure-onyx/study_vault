'use client';

import { useState } from 'react';
import { BookOpen, Upload, CheckCircle, AlertCircle, Loader2, Eye, X } from 'lucide-react';

interface IngestionState {
  idle: boolean;
  loading: boolean;
  success: boolean;
  error: boolean;
}

interface IngestionResult {
  success: boolean;
  message: string;
  data?: {
    bookId?: string;
    chaptersCreated?: number;
    topicsCreated?: number;
  };
}

export default function BooksIngestPage() {
  const [state, setState] = useState<IngestionState>({ idle: true, loading: false, success: false, error: false });
  const [result, setResult] = useState<IngestionResult | null>(null);
  const [bookData, setBookData] = useState<{
    boardSlug?: string;
    programSlug?: string;
    subjectSlug?: string;
    chapterNumber?: number;
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    gradeLevel: '',
    board: '',
    subject: '',
    description: '',
    coverImageUrl: '',
    jsonPayload: '',
  });

  // Helper function to generate slug
  const generateSlug = (text: string): string => {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[^\\w\\s-]/g, '')
      .replace(/\\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ idle: false, loading: true, success: false, error: false });
    setResult(null);

    try {
      const parsedJson = JSON.parse(formData.jsonPayload);
      
      // Validate chapter data - support multiple possible structures
      let chapterNumber: number | undefined;
      let chapterTitle: string | undefined;
      let chapterDescription: string | undefined;
      
      // Try different possible locations for chapter number
      if (parsedJson.chapter) {
        // Direct chapter object
        chapterNumber = parsedJson.chapter.number || parsedJson.chapter.chapter_number || parsedJson.chapter.id;
        chapterTitle = parsedJson.chapter.title || parsedJson.chapter.name;
        chapterDescription = parsedJson.chapter.description;
      } else if (parsedJson.book_metadata?.chapter) {
        // Nested in book_metadata
        chapterNumber = parsedJson.book_metadata.chapter.number || parsedJson.book_metadata.chapter.chapter_number;
        chapterTitle = parsedJson.book_metadata.chapter.title;
        chapterDescription = parsedJson.book_metadata.chapter.description;
      }
      
      // Validate chapter number exists and is valid
      if (chapterNumber === undefined || chapterNumber === null) {
        throw new Error('JSON payload must contain a "chapter" object with a "number", "chapter_number", or "id" field');
      }
      
      const chapterNum = Number(chapterNumber);
      if (isNaN(chapterNum) || chapterNum < 1) {
        throw new Error('Chapter number must be a valid positive integer (got: ' + chapterNumber + ')');
      }

      const ingestionData = {
        book_metadata: {
          title: parsedJson.book_metadata?.title || formData.title,
          subject: parsedJson.book_metadata?.subject || formData.subject,
          subject_slug: parsedJson.book_metadata?.subject_slug || generateSlug(formData.subject),
          grade_level: parsedJson.book_metadata?.grade_level || formData.gradeLevel,
          edition_year: parsedJson.book_metadata?.edition_year || new Date().getFullYear(),
          publisher: parsedJson.book_metadata?.publisher || undefined,
          authors: parsedJson.book_metadata?.authors || [],
          board: parsedJson.book_metadata?.board || formData.board,
          language: parsedJson.book_metadata?.language || 'english',
          script_direction: parsedJson.book_metadata?.script_direction || 'ltr',
        },
        chapter: {
          chapter_number: chapterNum,
          chapter_number_display: parsedJson.chapter?.chapter_number_display || `Chapter ${chapterNum}`,
          title: chapterTitle || `Chapter ${chapterNum}`,
          slug: parsedJson.chapter?.slug || undefined,
          page_start: parsedJson.chapter?.page_start || undefined,
          page_end: parsedJson.chapter?.page_end || undefined,
          student_learning_outcomes: parsedJson.chapter?.student_learning_outcomes || [],
          chapter_summary: chapterDescription || parsedJson.chapter?.chapter_summary || '',
          seo: parsedJson.chapter?.seo || undefined,
        },
        topics: (parsedJson.topics || []).map((topic: any, index: number) => ({
          title: topic.title || `Topic ${index + 1}`,
          title_urdu: topic.title_urdu || '',
          slug: topic.slug || undefined,
          topic_number: topic.topic_number || String(index + 1),
          display_order: topic.display_order || index,
          difficulty: topic.difficulty || 'medium',
          estimated_read_time: topic.estimated_read_time || 3,
          edition_year: topic.edition_year || new Date().getFullYear(),
          raw_text: topic.raw_text || '',
          clean_html: topic.clean_html || '',
          content_blocks: topic.content_blocks || [],
          formulas: topic.formulas || [],
          key_terms: topic.key_terms || [],
          book_mcqs: topic.book_mcqs || [],
          book_short_questions: topic.book_short_questions || [],
          book_problems: topic.book_problems || [],
          keywords: topic.keywords || [],
          quran_reference: topic.quran_reference || null,
          quran_word_alignments: topic.quran_word_alignments || [],
          quran_textbook_translation: topic.quran_textbook_translation || null,
          quran_textbook_tafsir: topic.quran_textbook_tafsir || null,
          seo: topic.seo || {},
        })),
      };

      const response = await fetch('/api/admin/books/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ingestionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ingestion failed');
      }

      setResult(data);
      setState({ idle: false, loading: false, success: true, error: false });
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'An unexpected error occurred',
      });
      setState({ idle: false, loading: false, success: false, error: true });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const value = event.target?.result as string;
      setFormData(prev => ({ ...prev, jsonPayload: value }));
      
      // Auto-extract metadata from JSON - always overwrite with JSON data
      try {
        const parsed = JSON.parse(value);
        if (parsed.book_metadata) {
          const boardSlug = parsed.book_metadata.board 
            ? parsed.book_metadata.board.toLowerCase().replace(/[^a-z0-9]+/g, '-') 
            : '';
          const programSlug = parsed.book_metadata.grade_level 
            ? parsed.book_metadata.grade_level.toLowerCase().replace(/[^a-z0-9]+/g, '-') 
            : '';
          const subjectSlug = parsed.book_metadata.subject_slug 
            || (parsed.book_metadata.subject 
              ? parsed.book_metadata.subject.toLowerCase().replace(/[^a-z0-9]+/g, '-') 
              : '');
          
          // Extract chapter number for preview URL
          let chapterNumber: number | undefined;
          if (parsed.chapter) {
            chapterNumber = parsed.chapter.number || parsed.chapter.chapter_number || parsed.chapter.id;
          } else if (parsed.book_metadata.chapter) {
            chapterNumber = parsed.book_metadata.chapter.number || parsed.book_metadata.chapter.chapter_number;
          }
          
          setFormData(prev => ({
            ...prev,
            title: parsed.book_metadata.title || '',
            gradeLevel: parsed.book_metadata.grade_level || '',
            board: parsed.book_metadata.board || '',
            subject: parsed.book_metadata.subject || '',
            description: parsed.book_metadata.description || '',
            coverImageUrl: parsed.book_metadata.cover_image_url || '',
          }));
          
          setBookData({
            boardSlug,
            programSlug,
            subjectSlug,
            chapterNumber: chapterNumber ? Number(chapterNumber) : undefined,
          });
        }
      } catch {
        // Invalid JSON, ignore auto-fill
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Book Ingestion</h1>
        </div>
        <p className="text-gray-500">
          Import curriculum content from DeepSeek JSON format. This will create or update books, chapters, and topics.
        </p>
      </div>

      {/* Success/Error Alerts */}
      {state.success && result && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-green-900">Ingestion Successful</h3>
            <p className="text-sm text-green-700 mt-1">{result.message}</p>
            {result.data && (
              <div className="mt-2 text-sm text-green-700">
                <p>Book ID: <code className="bg-green-100 px-2 py-0.5 rounded">{result.data.bookId}</code></p>
                <p>Topics Created: {result.data.topicsCreated || 0}</p>
              </div>
            )}
            <button
              onClick={() => {
                if (bookData?.boardSlug && bookData?.programSlug && bookData?.subjectSlug && bookData?.chapterNumber) {
                  const chapterSlug = `chapter-${bookData.chapterNumber}`;
                  window.open(`/${bookData.boardSlug}/${bookData.programSlug}/${bookData.subjectSlug}/${chapterSlug}`, '_blank');
                }
              }}
              disabled={loadingPreview}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loadingPreview ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              View in Student App
            </button>
          </div>
        </div>
      )}

      {state.error && result && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-red-900">Ingestion Failed</h3>
            <p className="text-sm text-red-700 mt-1">{result.message}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Metadata Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-gray-400" />
            Book Metadata
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Book Title *
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="e.g., Mathematics Class 10"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                required
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="e.g., Mathematics"
              />
            </div>

            <div>
              <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700 mb-1">
                Grade Level *
              </label>
              <input
                type="text"
                id="gradeLevel"
                required
                value={formData.gradeLevel}
                onChange={(e) => setFormData(prev => ({ ...prev, gradeLevel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="e.g., Class 10"
              />
            </div>

            <div>
              <label htmlFor="board" className="block text-sm font-medium text-gray-700 mb-1">
                Board *
              </label>
              <input
                type="text"
                id="board"
                required
                value={formData.board}
                onChange={(e) => setFormData(prev => ({ ...prev, board: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="e.g., FBISE"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                placeholder="Optional book description..."
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="coverImageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Cover Image URL
              </label>
              <input
                type="url"
                id="coverImageUrl"
                value={formData.coverImageUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, coverImageUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="https://example.com/cover.jpg"
              />
            </div>
          </div>
        </div>

        {/* JSON Payload Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Upload className="h-5 w-5 text-gray-400" />
            JSON Payload *
          </h2>
          
          <div>
            <label htmlFor="jsonPayload" className="block text-sm font-medium text-gray-700 mb-1">
              DeepSeek JSON Format
            </label>
            <input
              type="file"
              id="jsonFile"
              accept=".json"
              required
              onChange={handleFileUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {formData.jsonPayload && (
              <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" /> JSON loaded successfully
              </p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              Select your DeepSeek-generated JSON file here. Metadata will be auto-extracted if available.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={state.loading}
            className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {state.loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing Ingestion...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Start Ingestion
              </>
            )}
          </button>
        </div>
      </form>

      {/* Preview Modal */}
      {showPreview && bookPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Book Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
              <div className="space-y-6">
                {/* Book Info */}
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                  <h3 className="font-semibold text-indigo-900 text-lg">{bookPreview.title}</h3>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-indigo-600 font-medium">Subject:</span>
                      <span className="ml-2 text-indigo-900">{bookPreview.subject}</span>
                    </div>
                    <div>
                      <span className="text-indigo-600 font-medium">Grade:</span>
                      <span className="ml-2 text-indigo-900">{bookPreview.grade_level}</span>
                    </div>
                    <div>
                      <span className="text-indigo-600 font-medium">Board:</span>
                      <span className="ml-2 text-indigo-900">{bookPreview.board}</span>
                    </div>
                    {bookPreview.edition_year && (
                      <div>
                        <span className="text-indigo-600 font-medium">Edition:</span>
                        <span className="ml-2 text-indigo-900">{bookPreview.edition_year}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chapters and Topics */}
                {bookPreview.chapters && bookPreview.chapters.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 text-lg">Chapters & Topics</h3>
                    {bookPreview.chapters.map((chapter) => (
                      <div key={chapter._id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                          <h4 className="font-medium text-gray-900">
                            Chapter {chapter.chapter_number}: {chapter.title}
                          </h4>
                        </div>
                        <div className="p-4">
                          {chapter.topics && chapter.topics.length > 0 ? (
                            <ul className="space-y-2">
                              {chapter.topics.map((topic) => (
                                <li key={topic._id} className="flex items-start gap-2 text-sm">
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium flex-shrink-0">
                                    {topic.topic_number}
                                  </span>
                                  <span className="text-gray-900 font-medium">{topic.title}</span>
                                  {topic.slug && (
                                    <span className="text-gray-400 text-xs ml-auto">/{topic.slug}</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-500 text-sm italic">No topics in this chapter</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">How to use:</h3>
        <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
          <li>Generate curriculum content using DeepSeek AI with the book ingestion prompt and save it as a <code className="bg-gray-200 px-1 rounded">.json</code> file.</li>
          <li>The file must contain <code className="bg-gray-200 px-1 rounded">book_metadata</code>, <code className="bg-gray-200 px-1 rounded">chapter</code>, and <code className="bg-gray-200 px-1 rounded">topics</code>.</li>
          <li>Select the JSON file in the payload field above - metadata will auto-fill.</li>
          <li>Review and adjust metadata if needed.</li>
          <li>Click &quot;Start Ingestion&quot; to process the content.</li>
          <li>The system will create or update books, chapters, and topics intelligently.</li>
        </ol>
      </div>
    </div>
  );
}
