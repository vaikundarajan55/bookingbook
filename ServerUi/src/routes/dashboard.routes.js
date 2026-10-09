import { Router } from 'express';
import { getDashboard } from '../controllers/dashboard.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.get('/', authenticate, authorize('admin'), getDashboard);

export default router;
