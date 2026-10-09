import express from 'express';
import { CandidateController } from '../controllers/candidateController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', CandidateController.getCandidates);
router.get('/:id', CandidateController.getCandidateById);
router.post('/import', CandidateController.importCandidates);

export default router;
