import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fetch from 'node-fetch';

// Models - using relative paths since we are in /scripts
// and models are in /packages/db/models
// We use the full path to the .js file because of ESM
import QuranVerse from '../packages/db/models/QuranVerse';
import QuranWord from '../packages/db/models/QuranWord';

dotenv.config({ path: new URL('../.env.local', import.meta.url) });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is required in .env.local.');
}

async function connectDB() {
  await mongoose.connect(MONGODB_URI);
  console.log('✓ MongoDB connected successfully');
}

async function seedQuran() {
  try {
    await connectDB();
    
    console.log('Fetching Quran Uthmani data from Alquran.cloud...');
    const response = await fetch('https://api.alquran.cloud/v1/quran/quran-uthmani');
    const data = await response.json();
    
    if (data.code !== 200) {
      throw new Error(`API Error: ${data.status}`);
    }

    const surahs = data.data.surahs;
    let totalVerses = 0;
    let totalWords = 0;

    for (const surah of surahs) {
      const verseOps = [];
      const wordOps = [];

      for (const ayah of surah.ayahs) {
        // Prepare QuranVerse upsert
        verseOps.push({
          updateOne: {
            filter: { surah: surah.number, ayah: ayah.numberInSurah },
            update: { $set: { text_uthmani: ayah.text } },
            upsert: true
          }
        });

        // Split by whitespace and prepare QuranWord upserts
        const words = ayah.text.split(/\s+/).filter(w => w.length > 0);
        words.forEach((word, index) => {
          wordOps.push({
            updateOne: {
              filter: { surah: surah.number, ayah: ayah.numberInSurah, word_position: index + 1 },
              update: { $set: { arabic_word: word } },
              upsert: true
            }
          });
        });

        totalVerses += 1;
        totalWords += words.length;
      }

      // Execute in batches per surah
      if (verseOps.length > 0) await QuranVerse.bulkWrite(verseOps);
      if (wordOps.length > 0) await QuranWord.bulkWrite(wordOps);

      console.log(`Processed Surah ${surah.number}: ${surah.ayahs.length} verses, ${wordOps.length} words`);
    }

    console.log(`\n🎉 SEEDING COMPLETE!`);
    console.log(`Total Surahs: ${surahs.length}`);
    console.log(`Total Verses: ${totalVerses}`);
    console.log(`Total Words: ${totalWords}`);

  } catch (error) {
    console.error('✗ FATAL ERROR during seeding:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seedQuran();
