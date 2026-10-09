import { Router } from 'express';
import { createEmployee, deleteEmployee, listEmployees, updateEmployee } from '../controllers/employee.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate, authorize('admin'));
router.get('/', listEmployees);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

export default router;
