import { Router } from 'express';
import {
  allBookings, cancelMyBooking, checkout, createBooking, myBookings, updateBookingStatus,
} from '../controllers/booking.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.post('/', createBooking);
router.post('/checkout', checkout);
router.get('/mine', myBookings);
router.patch('/:id/cancel', cancelMyBooking);

router.get('/', authorize('admin'), allBookings);
router.patch('/:id/status', authorize('admin'), updateBookingStatus);

export default router;
