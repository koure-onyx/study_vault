import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@studyvault/db/connect';
import Topic from '@studyvault/db/models/Topic';
import QuranWord from '@studyvault/db/models/QuranWord';
import QuranVerse from '@studyvault/db/models/QuranVerse';

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const resolvedParams = await params;
    
    await connectDB();

    const { searchParams } = new URL(request.url);
    const surahParam = searchParams.get('surah');
    const ayahParam = searchParams.get('ayah');

    let surah: number, ayah: number;
    let topicAlignments: any[] = [];

    if (surahParam && ayahParam) {
      surah = parseInt(surahParam);
      ayah = parseInt(ayahParam);
    } else if (surahParam && !ayahParam) {
      // CHUNKED FETCH for entire Surah
      surah = parseInt(surahParam);
      const offset = parseInt(searchParams.get('offset') || '0');
      
      const quranWords = await QuranWord.find({ surah })
        .sort({ ayah: 1, word_position: 1 })
        .skip(offset * 20)
        .limit(2000)
        .lean();

      const verses = await QuranVerse.find({ surah })
        .sort({ ayah: 1 })
        .select('ayah text_uthmani')
        .lean();
      const verseTextByAyah = Object.fromEntries(
        verses.map((verse: any) => [verse.ayah, verse.text_uthmani])
      );
      
      // Group by Ayah - keep original sequence clean
      const groupedByAyah: Record<number, any[]> = {};

      quranWords.forEach(w => {
        if (!groupedByAyah[w.ayah]) groupedByAyah[w.ayah] = [];
        
        groupedByAyah[w.ayah].push({
          position: w.word_position,
          arabic_word: w.arabic_word,
          textbook_urdu_meaning: null,
        });
      });

      return NextResponse.json(
        {
          success: true,
          isGrouped: true,
          data: groupedByAyah,
          verseTextByAyah,
          hasMore: quranWords.length === 2000,
        },
        { headers: JSON_HEADERS }
      );
    } else {
      const topic = await Topic.findById(resolvedParams.topicId).select('quran_reference quran_word_alignments').lean();

      if (!topic) {
        return NextResponse.json({ success: false, error: 'Topic not found' }, { status: 404, headers: JSON_HEADERS });
      }

      if (!topic.quran_reference) {
        return NextResponse.json({ success: false, error: 'Topic does not contain Quran reference' }, { status: 400, headers: JSON_HEADERS });
      }

      surah = topic.quran_reference.surah;
      ayah = topic.quran_reference.ayah;
      topicAlignments = topic.quran_word_alignments || [];
    }

    // Fetch all words for this surah/ayah
    const quranWords = await QuranWord.find({ surah, ayah }).sort({ word_position: 1 }).lean();
    const quranVerse = await QuranVerse.findOne({ surah, ayah }).select('text_uthmani').lean();

    // Keep original sequence clean - no artificial merging
    const processedWords = quranWords;

    // Create a map for quick lookup by position
    const wordsMap = new Map(processedWords.map(w => [w.word_position, w.arabic_word]));

    // If we don't have alignments (Surah-wise reading), create basic alignments from the words themselves
    const mergedWords = processedWords.length > 0 && topicAlignments.length === 0
      ? processedWords.map(w => ({
          position: w.word_position,
          arabic_word: w.arabic_word,
          textbook_urdu_meaning: null,
        }))
      : topicAlignments.map((wa: any) => ({
          position: wa.position,
          textbook_urdu_meaning: wa.textbook_urdu_meaning,
          color_highlight: wa.color_highlight,
          grammar_note: wa.grammar_note,
          arabic_word: wordsMap.get(wa.position) || null
        }));

    return NextResponse.json(
      {
        success: true,
        data: mergedWords,
        verseText: quranVerse?.text_uthmani || mergedWords.map((word: any) => word.arabic_word).filter(Boolean).join(' '),
      },
      { headers: JSON_HEADERS }
    );
  } catch (error) {
    console.error('Get quran words error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch quran words' 
      },
      { status: 500, headers: JSON_HEADERS }
    );
  }
}
