import 'dotenv/config';
import mongoose from 'mongoose';
import { MongoClient, ObjectId } from 'mongodb';
import connectDB from '../packages/db/connect.js';
import Topic from '../packages/db/models/Topic.js';

// Simple logger
const log = [];

function normalizeKeyTerms(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((term) => {
      if (typeof term === 'string') {
        return { term, definition: '' };
      }
      if (term && typeof term === 'object') {
        return {
          term: String(term.term || term.name || term.label || '').trim(),
          definition: String(term.definition || term.explanation || '').trim(),
        };
      }
      return null;
    })
    .filter((item) => item && item.term);
}

/**
 * Process DeepSeek JSON response and ingest into database
 * Supports both regular topics and Quran topics
 */
async function processDeepSeekJSON(jsonData, adminUserId) {
  try {
    await connectDB();
    console.log('✓ Connected to database');

    const topics = jsonData.topics || [];
    console.log(`Processing ${topics.length} topics...`);

    for (const topicData of topics) {
      const topicLog = [];
      
      try {
        // Basic validation
        if (!topicData.title || !topicData.slug) {
          topicLog.push(`❌ Skipping topic: missing title or slug`);
          continue;
        }

        // Prepare topic payload
        const topicPayload = {
          title: topicData.title,
          title_urdu: topicData.title_urdu || null,
          slug: topicData.slug,
          topic_number: topicData.topic_number || null,
          display_order: topicData.display_order || 0,
          book_id: new ObjectId(topicData.book_id),
          chapter_id: new ObjectId(topicData.chapter_id),
          program_id: new ObjectId(topicData.program_id),
          board_id: topicData.board_id ? new ObjectId(topicData.board_id) : null,
          program_name: topicData.program_name,
          subject_name: topicData.subject_name,
          chapter_number: topicData.chapter_number,
          chapter_title: topicData.chapter_title,
          raw_text: topicData.raw_text || '',
          clean_html: topicData.clean_html || '',
          content_blocks: topicData.content_blocks || [],
          keywords: topicData.keywords || [],
          difficulty: topicData.difficulty || 'medium',
          estimated_read_time: topicData.estimated_read_time || 3,
          edition_year: topicData.edition_year || new Date().getFullYear(),
          version_status: topicData.version_status || 'new',
          is_live: topicData.is_live || false,
          workflow_status: topicData.workflow_status || 'draft',
          created_by: adminUserId,
        };

        // Handle Quran Reference if present
        if (topicData.quran_reference) {
          const { surah, ayah } = topicData.quran_reference;
          if (surah < 1 || surah > 114) {
            topicLog.push(`⚠ Warning: Invalid Surah ${surah} in topic ${topicData.slug}. Setting to null.`);
            topicPayload.quran_reference = null;
          } else if (ayah < 1) {
            topicLog.push(`⚠ Warning: Invalid Ayah ${ayah} in topic ${topicData.slug}. Setting to null.`);
            topicPayload.quran_reference = null;
          } else {
            topicPayload.quran_reference = topicData.quran_reference;
            topicPayload.quran_textbook_translation = topicData.quran_textbook_translation || null;
            topicPayload.quran_textbook_tafsir = topicData.quran_textbook_tafsir || null;

            // Validate word alignments
            if (Array.isArray(topicData.quran_word_alignments)) {
              topicPayload.quran_word_alignments = topicData.quran_word_alignments.filter(wa => {
                if (!Number.isInteger(wa.position) || wa.position < 1) {
                  topicLog.push(`⚠ Warning: Invalid word position ${wa.position} in topic ${topicData.slug}. Skipping alignment.`);
                  return false;
                }
                return true;
              });
            }
          }
        }

        topicPayload.key_terms = normalizeKeyTerms(topicData.key_terms || []);

        // Handle content blocks
        if (Array.isArray(topicData.content_blocks)) {
          topicPayload.content_blocks = topicData.content_blocks.map(block => {
            const processedBlock = { ...block };
            
            // Handle Quran verse blocks
            if (block.type === 'quran_verse' && block.quran_data) {
              const { surah, ayah } = block.quran_data;
              
              // Validate Quran data
              if (surah < 1 || surah > 114 || ayah < 1) {
                topicLog.push(`⚠ Warning: Invalid Quran verse data in block. Converting to paragraph.`);
                processedBlock.type = 'paragraph';
                processedBlock.quran_data = null;
              } else {
                // Validate word alignments in quran_data
                if (Array.isArray(block.quran_data.word_alignments)) {
                  processedBlock.quran_data.word_alignments = block.quran_data.word_alignments.filter(wa => {
                    if (!Number.isInteger(wa.position) || wa.position < 1) {
                      topicLog.push(`⚠ Warning: Invalid word position in Quran block. Skipping.`);
                      return false;
                    }
                    return true;
                  });
                }
              }
            }
            
            return processedBlock;
          });
        }

        // Update or create topic
        const existingTopic = await Topic.findOne({ slug: topicData.slug });
        
        if (existingTopic) {
          Object.assign(existingTopic, topicPayload);
          await existingTopic.save();
          topicLog.push(`✓ Updated topic: ${topicData.slug}`);
        } else {
          await Topic.create(topicPayload);
          topicLog.push(`✓ Created topic: ${topicData.slug}`);
        }

        // Log any warnings
        if (topicLog.length > 1) {
          log.push(...topicLog);
        } else {
          log.push(topicLog[0]);
        }

      } catch (error) {
        log.push(`❌ Error processing topic ${topicData.slug}: ${error.message}`);
        console.error(`Error processing topic ${topicData.slug}:`, error);
      }
    }

    console.log(`\n✅ Processing complete. Results:`);
    console.log(`   - Successfully processed: ${log.filter(l => l.startsWith('✓')).length} topics`);
    console.log(`   - Warnings: ${log.filter(l => l.startsWith('⚠')).length}`);
    console.log(`   - Errors: ${log.filter(l => l.startsWith('❌')).length}`);
    
    return { success: true, log };

  } catch (error) {
    console.error('Fatal error in ingestion:', error);
    log.push(`❌ Fatal error: ${error.message}`);
    return { success: false, error: error.message, log };
  } finally {
    await disconnectDB();
  }
}

async function disconnectDB() {
  try {
    // This assumes you have a disconnect function in your connect.js
    // If not, you might need to handle mongoose disconnection differently
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('✓ Disconnected from database');
    }
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
}

// Main execution
async function main() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    if (args.length < 1) {
      console.error('Usage: node scripts/ingestDeepSeekJSON.js <json-file-path> [admin-user-id]');
      process.exit(1);
    }

    const jsonFilePath = args[0];
    const adminUserId = args[1] || null;

    // Import JSON file (assuming it's CommonJS)
    const jsonData = require(jsonFilePath);
    
    if (!jsonData.topics || !Array.isArray(jsonData.topics)) {
      throw new Error('Invalid JSON format: expected topics array');
    }

    console.log('🚀 Starting DeepSeek JSON ingestion...');
    const result = await processDeepSeekJSON(jsonData, adminUserId);
    
    if (result.success) {
      console.log('\n🎉 Ingestion completed successfully!');
    } else {
      console.log('\n💥 Ingestion failed!');
      process.exit(1);
    }

  } catch (error) {
    console.error('FATAL ERROR:', error.message);
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  main();
}

module.exports = { processDeepSeekJSON };