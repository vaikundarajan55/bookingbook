import { Router } from 'express';
import { listUsers, toggleUserActive } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate, authorize('admin'));
router.get('/', listUsers);
router.patch('/:id/toggle-active', toggleUserActive);

export default router;
