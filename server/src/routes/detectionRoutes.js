import express from 'express';
import { DetectionController } from '../controllers/detectionController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', DetectionController.getDetections);
router.get('/:id', DetectionController.getDetectionById);
router.patch('/:id/status', DetectionController.updateStatus);
router.post('/:id/notes', DetectionController.addNote);

export default router;
