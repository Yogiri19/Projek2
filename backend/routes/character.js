import express from 'express';
import {
  getCharacters,
  getCharacterById,
  createCharacter,
  updateCharacter,
  deleteCharacter
} from '../controllers/characterController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getCharacters);
router.get('/:id', getCharacterById);
router.post('/', verifyToken, createCharacter);
router.put('/:id', verifyToken, updateCharacter);
router.delete('/:id', verifyToken, deleteCharacter);

export default router;
