'use client';

import { useState } from 'react';

interface ContentBlock {
  type: string;
  text?: string;
  html?: string;
  level?: number;
  latex?: string;
  formula_label?: string;
  headers?: string[];
  rows?: string[][];
  caption?: string;
  src?: string;
  alt?: string;
  items?: string[];
  ordered?: boolean;
  variant?: string;
  title?: string;
  problem?: string;
  solution?: string;
  steps?: string[];
  answer?: string;
  question?: string;
  options?: string[];
  correct_answer?: string;
  explanation?: string;
  term?: string;
  definition?: string;
  block_order?: number;
}

export default function ContentBlockRenderer({ blocks }: { blocks: ContentBlock[] }) {
  const [expandedExamples, setExpandedExamples] = useState<Set<number>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [showAnswers, setShowAnswers] = useState<{ [key: number]: boolean }>({});

  const toggleExample = (index: number) => {
    const newExpanded = new Set(expandedExamples);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedExamples(newExpanded);
  };

  const renderBlock = (block: ContentBlock, index: number) => {
    switch (block.type) {
      case 'heading':
        const HeadingTag = `h${block.level || 2}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag key={index} className="text-xl md:text-2xl font-bold text-slate-900 mt-8 mb-4">
            {block.text}
          </HeadingTag>
        );

      case 'paragraph':
        return (
          <p key={index} className="text-slate-700 leading-relaxed mb-4">
            {block.html ? (
              <span dangerouslySetInnerHTML={{ __html: block.html! }} />
            ) : (
              block.text
            )}
          </p>
        );

      case 'formula':
        return (
          <div key={index} className="my-6 p-4 bg-slate-50 rounded-lg border-l-4 border-emerald-500">
            {block.formula_label && (
              <div className="text-xs font-semibold text-emerald-700 mb-2">{block.formula_label}</div>
            )}
            <div className="text-center font-mono text-lg text-slate-800 overflow-x-auto">
              {block.latex || block.text}
            </div>
          </div>
        );

      case 'table':
        return (
          <div key={index} className="my-6 overflow-x-auto">
            <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
              {block.headers && (
                <thead className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white">
                  <tr>
                    {block.headers.map((header, i) => (
                      <th key={i} className="px-4 py-3 text-left font-semibold">{header}</th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {block.rows?.map((row, rowIndex) => (
                  <tr 
                    key={rowIndex} 
                    className={`${rowIndex % 2 === 0 ? 'bg-slate-50' : 'bg-white'} hover:bg-emerald-50 transition-colors`}
                  >
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3 border-t border-slate-200">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {block.caption && (
              <p className="text-sm text-slate-600 mt-2 italic">{block.caption}</p>
            )}
          </div>
        );

      case 'callout':
        const variantStyles = {
          'note': 'bg-amber-50 border-amber-400 text-amber-800',
          'activity': 'bg-blue-50 border-blue-400 text-blue-800',
          'warning': 'bg-red-50 border-red-400 text-red-800',
          'info': 'bg-cyan-50 border-cyan-400 text-cyan-800',
          'quick-quiz': 'bg-purple-50 border-purple-400 text-purple-800',
          'do-you-know': 'bg-teal-50 border-teal-400 text-teal-800',
          'caution': 'bg-orange-50 border-orange-400 text-orange-800',
          'lab-safety': 'bg-red-50 border-red-400 text-red-800',
        };
        const style = variantStyles[block.variant as keyof typeof variantStyles] || variantStyles.note;

        return (
          <div key={index} className={`my-6 p-4 rounded-lg border-l-4 ${style}`}>
            {block.title && (
              <div className="font-bold mb-2 flex items-center gap-2">
                {block.variant === 'activity' && '🧪'}
                {block.variant === 'warning' && '⚠️'}
                {block.variant === 'note' && '📝'}
                {block.variant === 'do-you-know' && '💡'}
                {block.title}
              </div>
            )}
            <div>{block.html ? (
              <span dangerouslySetInnerHTML={{ __html: block.html! }} />
            ) : (
              block.text
            )}</div>
          </div>
        );

      case 'example':
        const isExpanded = expandedExamples.has(index);
        return (
          <div key={index} className="my-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
            <div className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
              <span>📖</span> Example
            </div>
            {block.problem && (
              <div className="mb-4 text-slate-800">{block.problem}</div>
            )}
            {!isExpanded ? (
              <button
                onClick={() => toggleExample(index)}
                className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2"
              >
                <span>Show Solution</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="p-4 bg-white rounded-lg border border-indigo-100">
                  <div className="font-semibold text-indigo-700 mb-2">Solution:</div>
                  {block.solution && <div className="text-slate-700">{block.solution}</div>}
                  {block.steps?.map((step, i) => (
                    <div key={i} className="flex gap-3 mt-2">
                      <span className="font-bold text-indigo-600">{i + 1}.</span>
                      <span className="text-slate-700">{step}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => toggleExample(index)}
                  className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                >
                  Hide Solution
                </button>
              </div>
            )}
          </div>
        );

      case 'mcq':
        const selectedAnswer = selectedAnswers[index];
        const hasAnswered = !!selectedAnswer;
        const isCorrect = selectedAnswer === block.correct_answer;

        return (
          <div key={index} className="my-6 p-6 bg-white rounded-xl shadow-md border border-slate-200">
            <div className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>❓</span> Quick Quiz
            </div>
            {block.question && <p className="text-slate-700 mb-4">{block.question}</p>}
            <div className="space-y-2">
              {block.options?.map((option, optIndex) => {
                const optionLetter = String.fromCharCode(97 + optIndex);
                const isSelected = selectedAnswer === optionLetter;
                const showCorrect = hasAnswered && optionLetter === block.correct_answer;
                const showWrong = hasAnswered && isSelected && !isCorrect;

                return (
                  <button
                    key={optIndex}
                    onClick={() => !hasAnswered && setSelectedAnswers({ ...selectedAnswers, [index]: optionLetter })}
                    disabled={hasAnswered}
                    className={`
                      w-full text-left p-4 rounded-lg border-2 transition-all duration-200
                      ${showCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : ''}
                      ${showWrong ? 'border-red-500 bg-red-50 text-red-800' : ''}
                      ${!hasAnswered && isSelected ? 'border-indigo-500 bg-indigo-50' : ''}
                      ${!hasAnswered && !isSelected ? 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50' : ''}
                    `}
                  >
                    <span className="font-semibold mr-2">({optionLetter})</span>
                    {option}
                  </button>
                );
              })}
            </div>
            {hasAnswered && block.explanation && (
              <div className={`mt-4 p-4 rounded-lg ${isCorrect ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                <div className="font-semibold mb-1">
                  {isCorrect ? '✓ Correct!' : '✗ Not quite'}
                </div>
                <div className="text-sm text-slate-700">{block.explanation}</div>
              </div>
            )}
          </div>
        );

      case 'list':
        const ListTag = block.ordered ? 'ol' : 'ul';
        return (
          <ListTag 
            key={index} 
            className={`my-4 space-y-2 ${block.ordered ? 'list-decimal list-inside' : 'list-disc list-inside'}`}
          >
            {block.items?.map((item, i) => (
              <li key={i} className="text-slate-700 pl-2">{item}</li>
            ))}
          </ListTag>
        );

      case 'definition':
        return (
          <div key={index} className="my-4 p-4 bg-slate-50 rounded-lg border-l-4 border-cyan-500">
            <div className="font-bold text-cyan-800">{block.term}</div>
            <div className="text-slate-700 mt-1">{block.definition || block.text}</div>
          </div>
        );

      default:
        return block.text ? <p key={index} className="text-slate-700 mb-4">{block.text}</p> : null;
    }
  };

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}
