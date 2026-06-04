'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, BookOpen, ChevronDown, ChevronRight, ExternalLink, Layers, RefreshCw, Trash2 } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type Chapter = {
  _id: string;
  title: string;
  chapter_number: number;
  is_live: boolean;
  topic_count: number;
};

type Book = {
  _id: string;
  title: string;
  subject: string;
  subject_slug: string;
  edition_year: number;
  is_live: boolean;
  total_chapters?: number;
  total_topics?: number;
  program_id?: { name?: string; slug?: string };
  board_id?: { name?: string; short_code?: string };
  chapters: Chapter[];
};

export default function ManageBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  async function fetchBooks() {
    try {
      setLoading(true);
      const response = await fetch('/api/books', { cache: 'no-store' });
      const data = await response.json();

      if (!data.success) {
        setResult({ success: false, error: data.error || 'Failed to load books' });
        return;
      }

      setBooks(data.data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load books',
      });
    } finally {
      setLoading(false);
    }
  }

  function bookKey(book: Book) {
    return String(book._id);
  }

  function toggleBook(bookId: string) {
    setExpandedBooks((current) => {
      const next = new Set(current);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  }

  async function previewBook(book: Book) {
    const id = bookKey(book);
    try {
      setPreviewingId(id);
      const response = await fetch(`/api/books/${id}/preview-url`);
      const data = await response.json();

      if (!data.success || !data.data?.url) {
        setResult({ success: false, error: data.error || 'Could not open book preview' });
        return;
      }

      window.open(data.data.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open book preview',
      });
    } finally {
      setPreviewingId(null);
    }
  }

  async function deleteBook(book: Book) {
    const ok = window.confirm(
      `Delete "${book.title}"?\n\nThis permanently deletes the book, its chapters, topics, questions, student progress, and saved vault items linked to it.`
    );
    if (!ok) return;

    try {
      setDeletingId(book._id);
      const response = await fetch(`/api/books/${book._id}`, { method: 'DELETE' });
      const data = await response.json();

      if (!data.success) {
        setResult({ success: false, error: data.error || 'Failed to delete book' });
        return;
      }

      setBooks((current) => current.filter((item) => item._id !== book._id));
      setResult({
        success: true,
        message: `Deleted "${book.title}" with ${data.data.deletedChapters} chapters and ${data.data.deletedTopics} topics.`,
      });
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete book',
      });
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteChapter(bookId: string, chapter: Chapter) {
    const ok = window.confirm(
      `Delete "${chapter.title}"?\n\nThis permanently deletes the chapter, its topics, questions, student progress, and saved vault items linked to it.`
    );
    if (!ok) return;

    try {
      setDeletingId(chapter._id);
      const response = await fetch(`/api/chapters/${chapter._id}`, { method: 'DELETE' });
      const data = await response.json();

      if (!data.success) {
        setResult({ success: false, error: data.error || 'Failed to delete chapter' });
        return;
      }

      setBooks((current) =>
        current.map((book) => {
          if (book._id !== bookId) return book;

          const chapters = book.chapters.filter((item) => item._id !== chapter._id);
          return {
            ...book,
            chapters,
            total_chapters: chapters.length,
            total_topics: Math.max((book.total_topics || 0) - data.data.deletedTopics, 0),
          };
        })
      );
      setResult({
        success: true,
        message: `Deleted "${chapter.title}" with ${data.data.deletedTopics} topics.`,
      });
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete chapter',
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Manage Books
            </h1>
            <p className="text-slate-600 mt-1">
              Delete books or individual chapters from the database.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={fetchBooks} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <a href="/books/ingest">
              <Button>
                <BookOpen className="w-4 h-4 mr-2" />
                Ingest Book
              </Button>
            </a>
          </div>
        </div>

        <Card className="bg-red-50 border-red-200 text-red-900">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm leading-6">
              Deletes are permanent. Book deletes cascade through chapters, topics, questions, student progress, and vault items connected to that content.
            </p>
          </div>
        </Card>

        {result && (
          <Alert
            variant={result.success ? 'success' : 'error'}
            onDismiss={() => setResult(null)}
          >
            {result.success ? result.message : result.error}
          </Alert>
        )}

        {loading ? (
          <Card className="p-12 text-center text-slate-600">
            Loading books...
          </Card>
        ) : books.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">No books found</p>
            <p className="text-sm text-slate-500 mt-1">Ingest a book to manage it here.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {books.map((book) => {
              const id = bookKey(book);
              const isExpanded = expandedBooks.has(id);
              return (
                <Card key={id} className="overflow-hidden p-0">
                  <div className="p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <button
                      type="button"
                      onClick={() => toggleBook(id)}
                      className="flex items-start gap-3 text-left min-w-0 flex-1"
                    >
                      <span className="mt-1 text-slate-400">
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-bold text-slate-900 truncate">{book.title}</span>
                        <span className="block text-sm text-slate-500 mt-1">
                          {book.program_id?.name || 'Unknown program'} • {book.board_id?.short_code || book.board_id?.name || 'No board'} • {book.edition_year}
                        </span>
                        <span className="flex flex-wrap gap-2 mt-3 text-xs">
                          <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                            {book.chapters.length} chapters
                          </span>
                          <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                            {book.total_topics || 0} topics
                          </span>
                          <span className={`px-2 py-1 rounded-full ${book.is_live ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {book.is_live ? 'Live' : 'Draft'}
                          </span>
                        </span>
                      </span>
                    </button>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => previewBook(book)}
                        disabled={previewingId === id}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {previewingId === id ? 'Opening...' : 'Preview'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteBook(book)}
                        disabled={deletingId === id}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {deletingId === id ? 'Deleting...' : 'Delete Book'}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/70">
                      {book.chapters.length === 0 ? (
                        <div className="px-6 py-6 text-sm text-slate-500">No chapters in this book.</div>
                      ) : (
                        <div className="divide-y divide-slate-200">
                          {book.chapters.map((chapter) => (
                            <div key={chapter._id} className="px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-start gap-3 min-w-0">
                                <Layers className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-800 truncate">
                                    Chapter {chapter.chapter_number}: {chapter.title}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    {chapter.topic_count} topics • {chapter.is_live ? 'Live' : 'Draft'}
                                  </p>
                                </div>
                              </div>

                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteChapter(id, chapter)}
                                disabled={deletingId === String(chapter._id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {deletingId === chapter._id ? 'Deleting...' : 'Delete Chapter'}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
