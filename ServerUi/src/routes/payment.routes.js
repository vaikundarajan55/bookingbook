import { Router } from 'express';
import { createPayment, getPayment } from '../controllers/payment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);
router.post('/', createPayment);
router.get('/:reference', getPayment);

export default router;
