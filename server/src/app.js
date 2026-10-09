import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import { ENV } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

import authRoutes from './routes/authRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import scanRoutes from './routes/scanRoutes.js';
import candidateRoutes from './routes/candidateRoutes.js';
import detectionRoutes from './routes/detectionRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import systemRoutes from './routes/systemRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman) or localhost origins
    if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request Logging
if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(ENV.UPLOAD_DIR));

// Rate Limiter
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/detections', detectionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', systemRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    app: 'BRANDTRACE API',
    tagline: 'Follow the Identity. Find the Risk.',
    status: 'online',
    version: '1.0.0'
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
