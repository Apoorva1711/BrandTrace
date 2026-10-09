import express from 'express';
import { BrandController } from '../controllers/brandController.js';
import { requireAuth } from '../middleware/auth.js';
import { logoUpload } from '../middleware/upload.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', BrandController.getAllBrands);
router.post('/', logoUpload.single('logo'), BrandController.createBrand);
router.get('/:id', BrandController.getBrandById);
router.put('/:id', logoUpload.single('logo'), BrandController.updateBrand);
router.delete('/:id', BrandController.archiveBrand);

export default router;
