import express from 'express';
import { SystemController } from '../controllers/systemController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/health', SystemController.getHealth);
router.get('/sources/health', requireAuth, SystemController.getSourceHealth);
router.get('/dashboard/stats', requireAuth, SystemController.getDashboardStats);

export default router;
