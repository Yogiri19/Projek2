import express from 'express';
import { register, login, googleAuth, facebookAuth, me } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/facebook', facebookAuth);
router.get('/me', verifyToken, me);

export default router;
