import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    logger.info('MongoDB connected');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
