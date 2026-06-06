"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  BookOpen,
  Zap,
  Globe2,
  Moon,
  Calculator,
  Languages,
  Microscope,
  Atom,
  Lock,
  ArrowRight,
} from "lucide-react";

interface Book {
  _id: string;
  title: string;
  subject: string;
  board: string;
  grade: number;
  edition: string;
  chapters: number;
  topics: number;
  isDraft?: boolean;
  progress?: {
    topicsRead: number;
    percentage: number;
  };
}

interface BookCardProps {
  book: Book;
}

// Subject to icon and color mapping
const SUBJECT_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  Physics: { icon: Zap, color: "text-amber-500", bgColor: "bg-amber-500/10" },
  English: {
    icon: BookOpen,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  "Pakistan Studies": {
    icon: Globe2,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  Quran: { icon: Moon, color: "text-emerald-400", bgColor: "bg-emerald-400/10" },
  Mathematics: {
    icon: Calculator,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
  },
  Chemistry: { icon: Atom, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  Biology: {
    icon: Microscope,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  Urdu: { icon: Languages, color: "text-rose-500", bgColor: "bg-rose-500/10" },
};

const DEFAULT_SUBJECT_CONFIG = {
  icon: BookOpen,
  color: "text-slate-400",
  bgColor: "bg-slate-500/10",
};

export function BookCard({ book }: BookCard) {
  const config =
    SUBJECT_CONFIG[book.subject] || DEFAULT_SUBJECT_CONFIG;
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
    >
      {/* Dark Navy Header */}
      <div className="bg-slate-900 px-5 py-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Subject Icon */}
          <div
            className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}
          >
            <IconComponent className={`w-5 h-5 ${config.color}`} />
          </div>
          {/* Book Title */}
          <div>
            <h3 className="text-white font-bold text-base leading-tight line-clamp-2">
              {book.title}
            </h3>
            {/* Board Badge */}
            <span className="inline-block mt-1.5 px-2 py-0.5 bg-white/20 text-white text-xs font-medium rounded-full">
              {book.board}
            </span>
          </div>
        </div>
        {/* Draft Badge */}
        {book.isDraft && (
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/30">
            Draft
          </span>
        )}
      </div>

      {/* White Card Body */}
      <div className="p-5 flex flex-col gap-4">
        {/* Grade & Edition */}
        <div className="text-sm text-slate-600">
          <span className="font-semibold text-slate-700">
            Grade {book.grade}
          </span>{" "}
          · {book.edition} Edition
        </div>

        {/* Topic Count */}
        <div className="text-sm text-slate-500">
          {book.topics} topics across {book.chapters} chapters
        </div>

        {/* Progress Bar (if user has progress) */}
        {book.progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">
                {book.progress.percentage}% complete
              </span>
              <span className="text-slate-500">
                {book.progress.topicsRead} / {book.topics} topics read
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${book.progress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <Link
            href={`/books/${book._id}`}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 group/btn"
          >
            Open Book
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>

          {/* Preview link for draft + admin */}
          {book.isDraft && (
            <Link
              href={`/books/${book._id}?preview=true`}
              className="w-full text-center text-slate-600 hover:text-slate-800 text-sm font-medium py-1.5 transition-colors"
            >
              Preview
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
