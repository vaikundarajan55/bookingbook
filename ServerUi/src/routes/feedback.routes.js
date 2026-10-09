import { Router } from 'express';
import { createFeedback, deleteFeedback, listFeedback, updateFeedbackStatus } from '../controllers/feedback.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.post('/', createFeedback);

router.get('/', authorize('admin'), listFeedback);
router.patch('/:id/status', authorize('admin'), updateFeedbackStatus);
router.delete('/:id', authorize('admin'), deleteFeedback);

export default router;
