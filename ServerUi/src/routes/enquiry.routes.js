import { Router } from 'express';
import { createEnquiry, deleteEnquiry, listEnquiries, updateEnquiryStatus } from '../controllers/enquiry.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.post('/', createEnquiry);

router.get('/', authenticate, authorize('admin'), listEnquiries);
router.patch('/:id/status', authenticate, authorize('admin'), updateEnquiryStatus);
router.delete('/:id', authenticate, authorize('admin'), deleteEnquiry);

export default router;
