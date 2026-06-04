import connectDB from '../packages/db/connect.js';
import Chapter from '../packages/db/models/Chapter.js';

async function main() {
  try {
    await connectDB();
    const chapters = await Chapter.find({}).limit(10).sort({ chapter_number: 1 }).lean();
    console.log('Found chapters:', chapters.map(c => ({ _id: String(c._id), title: c.title, chapter_number: c.chapter_number, book_id: String(c.book_id) }))); 
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
