import { EmployeeModel } from '../models/Employee.model.js';
import { HotelModel } from '../models/Hotel.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../utils/validate.js';

const rules = (isCreate) => ({
  hotel_id: { required: isCreate, type: 'number' },
  name: { required: isCreate, minLength: 2 },
  designation: { required: isCreate, minLength: 2 },
  email: { type: 'email' },
  salary: { type: 'number', min: 0 },
  joined_on: { type: 'date' },
});

const assertHotelExists = async (hotelId) => {
  if (hotelId !== undefined && !(await HotelModel.findById(hotelId))) throw ApiError.badRequest('Validation failed', { hotel_id: 'Choose an existing hotel' });
};

export const listEmployees = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await EmployeeModel.list(req.query) });
});

export const createEmployee = asyncHandler(async (req, res) => {
  validate(req.body, rules(true));
  await assertHotelExists(req.body.hotel_id);
  res.status(201).json({ success: true, data: await EmployeeModel.create(req.body) });
});

export const updateEmployee = asyncHandler(async (req, res) => {
  validate(req.body, rules(false));
  if (!(await EmployeeModel.findById(req.params.id))) throw ApiError.notFound('Employee not found');
  await assertHotelExists(req.body.hotel_id);
  res.json({ success: true, data: await EmployeeModel.update(req.params.id, req.body) });
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  if (!(await EmployeeModel.findById(req.params.id))) throw ApiError.notFound('Employee not found');
  await EmployeeModel.remove(req.params.id);
  res.json({ success: true, message: 'Employee removed' });
});
