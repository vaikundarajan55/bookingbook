import { Router } from 'express';
import { getInvoice, getMyInvoice, listInvoices, updatePayment } from '../controllers/invoice.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
// Guests can open the invoice of their own booking; everything below is admin-only
router.get('/mine/:id', authenticate, getMyInvoice);
router.use(authenticate, authorize('admin'));
router.get('/', listInvoices);
router.get('/:id', getInvoice);
router.patch('/:id/payment', updatePayment);

export default router;
