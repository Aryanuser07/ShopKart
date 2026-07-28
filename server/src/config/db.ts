import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopkart';
    console.log(`[DB] Attempting connection to ${mongoUri}...`);
    
    // Set low selection timeout so it doesn't block server if local mongo isn't active
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ [DB] Connected to MongoDB successfully.');
  } catch (error: any) {
    console.warn('⚠️ [DB] Could not connect to real MongoDB instance:', error.message);
    console.log('ℹ️ [DB] Running with dynamic In-Memory Data Store fallback mode for zero-config preview.');
  }
};
