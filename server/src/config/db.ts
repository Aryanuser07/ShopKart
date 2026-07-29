import mongoose from 'mongoose';

export const connectDB = async () => {
  if (process.env.NODE_ENV === 'test') {
    // Suppress DB connection attempts/warnings during automated Jest test runs
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/shopkart';
    console.log(`[DB] Attempting connection to ${mongoUri}...`);
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ [DB] Connected to MongoDB successfully.');
  } catch (error: any) {
    console.warn('⚠️ [DB] Could not connect to MongoDB instance:', error.message);
  }
};
