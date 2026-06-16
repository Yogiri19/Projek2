import express from 'express';
import {
  getMemories,
  createMemory,
  updateMemory,
  deleteMemory
} from '../controllers/memoryController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getMemories);
router.post('/', createMemory);
router.put('/:id', updateMemory);
router.delete('/:id', deleteMemory);

export default router;
