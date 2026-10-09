import { Router } from 'express';
import { createRoom, deleteRoom, getRoom, listRooms, updateRoom } from '../controllers/room.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.get('/', listRooms);
router.get('/admin/all', authenticate, authorize('admin'), (req, _res, next) => { req.query.includeInactive = 'true'; next(); }, listRooms);
router.get('/:id', getRoom);
router.post('/', authenticate, authorize('admin'), createRoom);
router.put('/:id', authenticate, authorize('admin'), updateRoom);
router.delete('/:id', authenticate, authorize('admin'), deleteRoom);

export default router;
