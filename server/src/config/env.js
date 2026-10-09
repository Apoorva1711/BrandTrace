import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root or server directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/brandtrace',
  JWT_SECRET: process.env.JWT_SECRET || 'brandtrace-dev-secret-key-32chars-min!',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  DETECTION_SERVICE_URL: process.env.DETECTION_SERVICE_URL || 'http://127.0.0.1:8001',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads')
};
