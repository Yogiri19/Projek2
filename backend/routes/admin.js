import express from 'express';
import { getStats, deleteUser, deleteCharacterAdmin, monitorApiUsage } from '../controllers/adminController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyAdmin);

router.get('/stats', getStats);
router.get('/monitor', monitorApiUsage);
router.delete('/users/:id', deleteUser);
router.delete('/characters/:id', deleteCharacterAdmin);

export default router;
