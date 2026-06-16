import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getSettings);
router.put('/', updateSettings);

export default router;
