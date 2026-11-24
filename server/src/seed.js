import { env } from './config/env.js';
import mongoose from 'mongoose';
import { initializeData } from './utils/initializeData.js';

async function runSeed() {
  if (!env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in server/.env');
    process.exit(1);
  }

  const force = process.argv.includes('--force');

  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    await initializeData({ force });
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
}

runSeed();
