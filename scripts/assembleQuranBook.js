import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Program from '../packages/db/models/Program';
import Board from '../packages/db/models/Board';
import Book from '../packages/db/models/Book';
import Chapter from '../packages/db/models/Chapter';
import Topic from '../packages/db/models/Topic';
import QuranVerse from '../packages/db/models/QuranVerse';

dotenv.config({ path: new URL('../.env.local', import.meta.url) });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is required in .env.local.');
}

async function assembleQuran() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const board = await Board.findOneAndUpdate(
      { slug: 'quran' },
      {
        name: 'Quran',
        slug: 'quran',
        short_code: 'QURAN',
        country: 'Global',
        is_active: true
      },
      { upsert: true, new: true }
    );
    console.log('✅ Quran Board ready');

    // 1. Create/Update Quran Program
    const program = await Program.findOneAndUpdate(
      { slug: 'quran' },
      {
        name: 'The Holy Quran',
        slug: 'quran',
        short_name: 'Quran',
        program_type: 'custom',
        description: 'The Complete Holy Quran with Word-by-Word Analysis',
        is_active: true,
        display_order: 0,
        applicable_boards: [{
          board_id: board._id,
          board_name: board.name
        }]
      },
      { upsert: true, new: true }
    );
    console.log('✅ Quran Program ready');

    // 2. Create/Update Quran Book
    const book = await Book.findOneAndUpdate(
      { subject_slug: 'the-holy-quran', program_id: program._id },
      {
        title: 'The Holy Quran (Uthmani)',
        slug: 'the-holy-quran',
        subject: 'The Holy Quran',
        subject_slug: 'the-holy-quran',
        program_id: program._id,
        board_id: board._id,
        program_name: program.name,
        is_active: true,
        is_live: true,
        edition_year: 2026
      },
      { upsert: true, new: true }
    );
    console.log('✅ Quran Book ready');

    // 3. Create a single Chapter for the whole Quran
    const chapter = await Chapter.findOneAndUpdate(
      { book_id: book._id, slug: 'noble-quran' },
      {
        title: 'The Noble Quran',
        slug: 'noble-quran',
        chapter_number: 1,
        book_id: book._id,
        program_id: program._id,
        board_id: board._id,
        is_active: true,
        is_live: true
      },
      { upsert: true, new: true }
    );
    console.log('✅ Chapter ready');

    // 4. Cleanup old individual Ayah topics to avoid confusion
    await Topic.deleteMany({ book_id: book._id, slug: { $regex: /^surah-\d+-ayah-/ } });
    console.log('🗑️ Cleaned up old Ayah-wise topics');

    // 5. Fetch Surah metadata
    console.log('Fetching Surah metadata...');
    const metaResponse = await fetch('https://api.alquran.cloud/v1/surah');
    const metaData = await metaResponse.json();
    const surahMeta = metaData.data;

    // 6. Group Verses by Surah
    const allVerses = await QuranVerse.find().sort({ surah: 1, ayah: 1 }).lean();
    const surahMap = new Map();
    allVerses.forEach(v => {
      if (!surahMap.has(v.surah)) surahMap.set(v.surah, []);
      surahMap.get(v.surah).push(v);
    });

    console.log(`Assembling ${surahMap.size} Surahs...`);

    for (const [surahNum, ayahs] of surahMap) {
      const meta = surahMeta.find(m => m.number === surahNum);
      const surahName = meta ? `${meta.number}. ${meta.englishName} (${meta.name})` : `Surah ${surahNum}`;
      
      const contentBlocks = ayahs.map(ayah => ({
        type: 'quran_verse',
        quran_data: {
          surah: surahNum,
          ayah: ayah.ayah
        }
      }));

      await Topic.findOneAndUpdate(
        { book_id: book._id, chapter_id: chapter._id, slug: `surah-${surahNum}` },
        {
          title: surahName,
          slug: `surah-${surahNum}`,
          display_order: surahNum,
          chapter_id: chapter._id,
          book_id: book._id,
          program_id: program._id,
          is_live: true,
          quran_reference: {
            surah: surahNum,
            ayah: 1, // Reference the first ayah for the whole surah topic
            surah_name_arabic: meta?.name,
            surah_name_english: meta?.englishName,
          },
          content_blocks: contentBlocks,
          raw_text: surahName,
          clean_html: `<h2>${surahName}</h2>`,
          difficulty: 'medium',
          estimated_read_time: Math.ceil(ayahs.length * 0.5) // Approx 30s per ayah
        },
        { upsert: true }
      );

      process.stdout.write('.');
    }

    console.log('\n\n🎉 QURAN ASSEMBLED SURAH-WISE SUCCESSFULLY!');
    console.log(`URL: /quran/the-holy-quran`);

  } catch (error) {
    console.error('✗ Assembly Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

assembleQuran();
