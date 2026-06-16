import express from 'express';
import {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  regenerateResponse
} from '../controllers/chatController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getConversations);
router.post('/', createConversation);
router.get('/:conversationId/messages', getMessages);
router.post('/:conversationId/messages', sendMessage);
router.put('/message/:messageId', editMessage);
router.delete('/message/:messageId', deleteMessage);
router.post('/:conversationId/regenerate', regenerateResponse);

export default router;
