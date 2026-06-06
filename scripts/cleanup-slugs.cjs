const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://koure666_db_user:OwEkjvSOiZ6zN3Zy@cluster0.iwupynf.mongodb.net/studyvault?appName=Cluster0';

async function cleanup() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  const collections = ['programs', 'boards', 'books', 'chapters', 'topics'];
  for (const coll of collections) {
    const res = await mongoose.connection.collection(coll).deleteMany({ slug: '-' });
    console.log(`Deleted ${res.deletedCount} from ${coll}`);
  }

  await mongoose.disconnect();
}

cleanup().catch(console.error);
