import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

mongoose.connect(process.env.MONGODB_URI);

const TopicSchema = new mongoose.Schema({}, { strict: false });
const Topic = mongoose.model('Topic', TopicSchema);

async function run() {
  const topics = await Topic.find().limit(3).lean();
  topics.forEach(t => {
    console.log(`http://localhost:3000/${t.program_name.toLowerCase().replace(/ /g, '-')}/${t.subject_name.toLowerCase().replace(/ /g, '-')}/chapter-${t.chapter_number}/${t.slug}`);
  });
  process.exit(0);
}
run();
