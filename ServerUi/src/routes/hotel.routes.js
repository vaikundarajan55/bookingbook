import { Router } from 'express';
import { createHotel, deleteHotel, getHotel, listHotels, updateHotel } from '../controllers/hotel.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.get('/', listHotels);
router.get('/admin/all', authenticate, authorize('admin'), (req, _res, next) => { req.query.includeInactive = 'true'; next(); }, listHotels);
router.get('/:id', getHotel);
router.post('/', authenticate, authorize('admin'), createHotel);
router.put('/:id', authenticate, authorize('admin'), updateHotel);
router.delete('/:id', authenticate, authorize('admin'), deleteHotel);

export default router;
