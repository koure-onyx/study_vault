# Quran Support in StudyVault PK

## Overview

StudyVault PK now supports a 50/50 hybrid system for Quran verse content, combining AI-generated Urdu translations from DeepSeek with verified Arabic text from a local Quran database.

## Setup

### 1. Seed the Quran Database

Before using Quran features, you need to seed the local Quran database:

```bash
npm run db:seed-quran
```

This script will:
- Download the complete Quran Uthmani text from Alquran.cloud API
- Create two MongoDB collections:
  - `QuranVerse`: Contains full Arabic text for each verse
  - `QuranWord`: Contains individual words from each verse with 1-based indexing
- Process approximately 6,236 verses and ~77,000 words

### 2. Use DeepSeek Prompt V2 for Extraction

When ingesting new content that includes Quran verses, ensure your DeepSeek prompt includes Quran detection capabilities. The AI should output JSON with Quran-specific fields:

```json
{
  "topics": [
    {
      "title": "Introduction to Surah Al-Fatiha",
      "slug": "introduction-to-surah-al-fatiha",
      "quran_reference": {
        "surah": 1,
        "ayah": 1,
        "surah_name_arabic": "الفاتحة",
        "surah_name_english": "The Opening",
        "juz": 1,
        "manzil": 1,
        "ruku": 1
      },
      "quran_textbook_translation": "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
      "quran_textbook_tafsir": "This verse begins with the Basmalah, which is recited before most chapters of the Quran...",
      "quran_word_alignments": [
        {
          "position": 1,
          "textbook_urdu_meaning": "اللہ کے نام سے",
          "color_highlight": "#3B82F6",
          "grammar_note": "Ism (Noun)"
        },
        {
          "position": 2,
          "textbook_urdu_meaning": "الرحمٰن الرحیم",
          "color_highlight": "#10B981",
          "grammar_note": "Sifah (Adjective)"
        }
      ],
      "content_blocks": [
        {
          "type": "quran_verse",
          "quran_data": {
            "surah": 1,
            "ayah": 1,
            "textbook_line_translation": "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
            "word_alignments": [
              {
                "position": 1,
                "textbook_urdu_meaning": "اللہ کے نام سے"
              },
              {
                "position": 2,
                "textbook_urdu_meaning": "الرحمٰن الرحیم"
              }
            ]
          },
          "block_order": 1
        }
      ]
    }
  ]
}
```

## Architecture

### Data Flow

1. **Ingestion**: DeepSeek JSON → MongoDB Topic document with Quran reference fields
2. **Storage**: Arabic text stored in `QuranWord` and `QuranVerse` collections (read-only)
3. **Runtime**: API endpoint merges AI Urdu translations with verified Arabic text
4. **Rendering**: React component displays Arabic with Urdu translations below

### Collections

#### QuranVerse
- Stores full Arabic text for each verse
- Schema: `{ surah, ayah, text_uthmani }`
- Index: `{ surah: 1, ayah: 1 }` (unique)

#### QuranWord
- Stores individual words from each verse
- Schema: `{ surah, ayah, word_position, arabic_word, root_word?, transliteration?, global_urdu_meaning? }`
- Index: `{ surah: 1, ayah: 1, word_position: 1 }` (unique)

#### Topic (Extended)
- Added optional Quran fields:
  - `quran_reference`: Metadata about the verse
  - `quran_word_alignments`: AI-generated Urdu translations per word
  - `quran_textbook_translation`: Full verse translation
  - `quran_textbook_tafsir`: Tafsir explanation

### API Endpoints

#### GET /api/topics/:topicId/quran-words
Merges AI Urdu translations with verified Arabic text:

```json
{
  "success": true,
  "data": [
    {
      "position": 1,
      "arabic_word": "بِسْمِ",
      "textbook_urdu_meaning": "اللہ کے نام سے",
      "color_highlight": "#3B82F6",
      "grammar_note": "Ism (Noun)"
    }
  ]
}
```

### Frontend Components

#### QuranVerseRenderer
Displays Quran verse with:
- Main Arabic text line (RTL)
- Word-by-word Urdu translations in cards
- Full translation line
- Tafsir section
- Color-coded words for highlighting

## Backward Compatibility

- All new fields are optional
- Existing topics render identically to before
- No schema migration required
- Quran detection is AI-driven - if AI doesn't output Quran data, system behaves as before

## Testing

After implementation, verify:

1. **Database seeding**:
   ```bash
   npm run db:seed-quran
   ```
   - Verify 6,236 verses and ~77,000 words are inserted
   - Check indexes are created properly

2. **Non-Quran content**:
   - Ingest regular textbook content
   - Verify existing rendering unchanged

3. **Quran content**:
   - Ingest topic with `quran_reference` field
   - Verify `quran_reference` fields populated
   - Verify Arabic merged at runtime via API

4. **Frontend**:
   - Verify Quran words render with Arabic above Urdu
   - Verify color highlights work
   - Verify no Arabic glyphs in Topics collection (only in QuranWord)

## Troubleshooting

### Common Issues

1. **Empty Quran data**: Check if DeepSeek prompt includes Quran detection
2. **API errors**: Verify MongoDB connection and `QuranWord` collection exists
3. **Display issues**: Check component props and API response format

### Debug Commands

```bash
# Check database connection
mongosh studyvault

# Count verses
db.QuranVerse.countDocuments()

# Count words
db.QuranWord.countDocuments()

# Check specific verse
db.QuranVerse.find({ surah: 1, ayah: 1 })
```