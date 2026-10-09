import { Router } from 'express';
import authRoutes from './auth.routes.js';
import hotelRoutes from './hotel.routes.js';
import roomRoutes from './room.routes.js';
import bookingRoutes from './booking.routes.js';
import userRoutes from './user.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import employeeRoutes from './employee.routes.js';
import invoiceRoutes from './invoice.routes.js';
import feedbackRoutes from './feedback.routes.js';
import enquiryRoutes from './enquiry.routes.js';
import paymentRoutes from './payment.routes.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, status: 'ok', time: new Date().toISOString() }));
router.use('/auth', authRoutes);
router.use('/hotels', hotelRoutes);
router.use('/rooms', roomRoutes);
router.use('/bookings', bookingRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/employees', employeeRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/enquiries', enquiryRoutes);
router.use('/payments', paymentRoutes);

export default router;
