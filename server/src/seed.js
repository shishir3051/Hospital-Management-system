import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { initializeData } from './utils/initializeData.js';

dotenv.config();

const seed = async () => {
  try {
    console.log('Connecting to MongoDB for seeding...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    // Clear existing data? The initializeData script checks if User count > 0.
    // I'll force it by clearing if the user wants, or just let it skip if already there.
    // For a "Continue" request after implementation, I'll assume they want the data seeded now.

    await initializeData();
    
    console.log('Seeding process complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
