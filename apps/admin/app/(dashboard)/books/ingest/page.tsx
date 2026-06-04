'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

interface IngestLog {
  success: boolean;
  data?: {
    message: string;
    log: string[];
    bookId: string;
    chapterId: string;
    programSlug?: string;
    subjectSlug?: string;
    chapterNumber?: number;
    firstTopicSlug?: string;
  };
  error?: string;
  log?: string[];
}

export default function BookIngestPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{
    title?: string;
    subject?: string;
    chapter?: string;
    topicCount?: number;
  } | null>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<IngestLog | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'application/json' || droppedFile.name.toLowerCase().endsWith('.json'))) {
      setFile(droppedFile);
      readAndPreview(droppedFile);
    } else {
      setResult({
        success: false,
        error: 'Please drop a valid JSON file',
      });
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      readAndPreview(selectedFile);
    }
  };

  const sanitizeJsonString = (rawText: string) => {
    let cleaned = rawText.trim();
    
    // 1. Extract JSON content between the first { and the last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    // 2. Remove common PCTB watermarks if they accidentally leaked into string values
    cleaned = cleaned.replace(/PCTB/g, '');
    cleaned = cleaned.replace(/Punjab Curriculum and Textbook Board/g, '');
    cleaned = cleaned.replace(/Not for Sale/g, '');
    
    return cleaned;
  };

  const readAndPreview = async (file: File) => {
    try {
      const text = await file.text();
      const sanitizedText = sanitizeJsonString(text);
      const json = JSON.parse(sanitizedText);
      
      if (json.book_metadata && json.chapter && json.topics) {
        setPreview({
          title: json.book_metadata.title || 'Unknown',
          subject: json.book_metadata.subject || 'Unknown',
          chapter: json.chapter.title || `Chapter ${json.chapter.chapter_number}`,
          topicCount: json.topics.length,
        });
        setResult(null);
      } else {
        setResult({
          success: false,
          error: 'Invalid JSON structure. Missing required fields.',
        });
      }
    } catch (err) {
      setResult({
        success: false,
        error: 'Failed to parse JSON file. Please check the format.',
      });
    }
  };

  const handleIngest = async () => {
    if (!file) return;

    setIsIngesting(true);
    setLogs([]);
    setResult(null);

    try {
      const text = await file.text();
      const sanitizedText = sanitizeJsonString(text);
      const deepseekJson = JSON.parse(sanitizedText);

      const response = await fetch('/api/books/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deepseekJson }),
      });

      const data = await response.json();

      if (data.success && data.data?.log) {
        setResult(data);
        setIsIngesting(false); // Enable buttons immediately
        
        // Stream logs one by one for effect without blocking result
        for (let i = 0; i < data.data.log.length; i++) {
          setLogs(prev => [...prev, data.data.log[i]]);
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } else {
        setResult(data);
        if (data.log) {
          setLogs(data.log);
        }
      }
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Ingestion failed',
      });
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
            Book Ingestion
          </h1>
          <p className="text-slate-600">
            Drop DeepSeek JSON files to ingest textbook chapters
          </p>
        </div>

        {/* Upload Zone */}
        <Card className="border-2 border-dashed transition-all duration-300">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative p-12 text-center cursor-pointer
              transition-all duration-300 rounded-lg
              ${isDragging 
                ? 'border-emerald-500 bg-emerald-50 scale-[1.02]' 
                : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
              }
            `}
          >
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-100 to-cyan-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              
              <div>
                <p className="text-lg font-semibold text-slate-700">
                  {file ? file.name : 'Drop your JSON file here'}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  or click to browse • Only .json files accepted
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Preview */}
        {preview && (
          <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-emerald-500">
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Preview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Book:</span>
                  <p className="font-medium text-slate-800">{preview.title}</p>
                </div>
                <div>
                  <span className="text-slate-500">Subject:</span>
                  <p className="font-medium text-slate-800">{preview.subject}</p>
                </div>
                <div>
                  <span className="text-slate-500">Chapter:</span>
                  <p className="font-medium text-slate-800">{preview.chapter}</p>
                </div>
                <div>
                  <span className="text-slate-500">Topics:</span>
                  <p className="font-medium text-emerald-600">{preview.topicCount} topics</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Action Button */}
        {preview && (
          <Button
            onClick={handleIngest}
            disabled={isIngesting}
            className="w-full py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isIngesting ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Ingesting Chapter...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Ingest Chapter
              </span>
            )}
          </Button>
        )}

        {/* Live Logs */}
        {logs.length > 0 && (
          <Card className="bg-slate-900 text-white font-mono text-sm overflow-hidden">
            <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-2 text-slate-400">Ingestion Log</span>
            </div>
            <div className="p-4 space-y-1 max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`
                    ${log.startsWith('✓') ? 'text-emerald-400' : ''}
                    ${log.startsWith('✗') ? 'text-red-400' : ''}
                    ${log.includes('FATAL') ? 'text-red-500 font-bold' : ''}
                  `}
                >
                  {log}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Result Alerts */}
        {result && !isIngesting && (
          result.success ? (
            <Alert variant="success" className="border-l-4">
              <div className="space-y-2">
                <p className="font-semibold">✓ Ingestion Complete!</p>
                <p className="text-sm opacity-90">
                  {result.data?.message}
                </p>
                {result.data?.bookId && (
                  <div className="pt-4 flex flex-col sm:flex-row gap-4 border-t border-emerald-200 mt-4">
                    <a
                      href={`/content?chapter=${result.data.chapterId}`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      Review in Admin
                    </a>
                    
                    {result.data.programSlug && (
                      <a
                        href={`http://localhost:3000/${result.data.programSlug}/${result.data.subjectSlug}/chapter-${result.data.chapterNumber}/${result.data.firstTopicSlug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-emerald-700 border border-emerald-300 text-sm font-medium rounded-lg hover:bg-emerald-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        Preview Student App
                      </a>
                    )}
                  </div>
                )}
              </div>
            </Alert>
          ) : (
            <Alert variant="error" className="border-l-4">
              <p className="font-semibold">✗ Ingestion Failed</p>
              <p className="text-sm mt-1">{result.error}</p>
            </Alert>
          )
        )}

        {/* Help Section */}
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">How to use:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>Export a chapter from DeepSeek as JSON</li>
                <li>Drag and drop the file above</li>
                <li>Review the preview to ensure it's correct</li>
                <li>Click "Ingest Chapter" to process</li>
                <li>Review ingested topics before approving</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
