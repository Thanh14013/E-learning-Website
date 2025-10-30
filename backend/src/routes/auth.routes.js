import express from 'express';
import { register } from '../controllers/auth.controller.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', register);

export default router;