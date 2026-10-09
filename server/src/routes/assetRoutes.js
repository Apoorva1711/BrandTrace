import express from 'express';
import { AssetController } from '../controllers/assetController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', AssetController.getAllAssets);
router.get('/brand/:brandId', AssetController.getAssetsByBrand);
router.post('/brand/:brandId', AssetController.createAsset);
router.post('/', AssetController.createAsset);
router.put('/:id', AssetController.updateAsset);
router.delete('/:id', AssetController.deleteAsset);

export default router;
