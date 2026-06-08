'use client';

import { useState } from 'react';
import { BookOpen, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

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
  
  const [formData, setFormData] = useState({
    title: '',
    gradeLevel: '',
    board: '',
    subject: '',
    description: '',
    coverImageUrl: '',
    jsonPayload: '',
  });

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
          title: formData.title,
          grade_level: formData.gradeLevel,
          board: formData.board,
          subject: formData.subject,
          description: formData.description || undefined,
          cover_image_url: formData.coverImageUrl || undefined,
        },
        chapter: {
          title: chapterTitle || `Chapter ${chapterNum}`,
          number: chapterNum,
          description: chapterDescription || undefined,
        },
        topics: parsedJson.topics || [],
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
          setFormData(prev => ({
            ...prev,
            title: parsed.book_metadata.title || '',
            gradeLevel: parsed.book_metadata.grade_level || '',
            board: parsed.book_metadata.board || '',
            subject: parsed.book_metadata.subject || '',
            description: parsed.book_metadata.description || '',
            coverImageUrl: parsed.book_metadata.cover_image_url || '',
          }));
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
