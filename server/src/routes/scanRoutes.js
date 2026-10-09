import express from 'express';
import { ScanController } from '../controllers/scanController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.post('/', ScanController.createScan);
router.get('/', ScanController.getScans);
router.get('/:id', ScanController.getScanById);
router.get('/:id/results', ScanController.getScanResults);

export default router;
