import express from 'express';
import { login, register, verifyEmail } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', register);
router.post('/verify-email/:token', verifyEmail);
router.post('/login', login);

export default router;