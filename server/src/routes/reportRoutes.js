import express from 'express';
import { ReportController } from '../controllers/reportController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/detections.csv', ReportController.exportDetectionsCsv);
router.get('/scans.csv', ReportController.exportScansCsv);

export default router;
