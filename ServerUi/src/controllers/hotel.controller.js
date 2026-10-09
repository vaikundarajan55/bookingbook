import { HotelModel } from '../models/Hotel.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../utils/validate.js';
import { emitToAll, SOCKET_EVENTS } from '../sockets/index.js';

export const listHotels = asyncHandler(async (req, res) => {
  const isAdminView = req.user?.role === 'admin' && req.query.includeInactive === 'true';
  const hotels = await HotelModel.list({ search: req.query.search, includeInactive: isAdminView });
  res.json({ success: true, data: hotels });
});

export const getHotel = asyncHandler(async (req, res) => {
  const hotel = await HotelModel.findById(req.params.id);
  if (!hotel) throw ApiError.notFound('Hotel not found');
  res.json({ success: true, data: hotel });
});

export const createHotel = asyncHandler(async (req, res) => {
  validate(req.body, {
    name: { required: true, minLength: 2 },
    city: { required: true, minLength: 2 },
    star_rating: { type: 'number', min: 1, max: 5 },
  });
  const hotel = await HotelModel.create(req.body);
  emitToAll(SOCKET_EVENTS.HOTEL_CHANGED, { action: 'created', hotel });
  res.status(201).json({ success: true, data: hotel });
});

export const updateHotel = asyncHandler(async (req, res) => {
  validate(req.body, {
    name: { minLength: 2 },
    city: { minLength: 2 },
    star_rating: { type: 'number', min: 1, max: 5 },
  });
  if (!(await HotelModel.findById(req.params.id))) throw ApiError.notFound('Hotel not found');
  const hotel = await HotelModel.update(req.params.id, req.body);
  emitToAll(SOCKET_EVENTS.HOTEL_CHANGED, { action: 'updated', hotel });
  res.json({ success: true, data: hotel });
});

export const deleteHotel = asyncHandler(async (req, res) => {
  if (!(await HotelModel.findById(req.params.id))) throw ApiError.notFound('Hotel not found');
  await HotelModel.archive(req.params.id);
  emitToAll(SOCKET_EVENTS.HOTEL_CHANGED, { action: 'archived', id: Number(req.params.id) });
  res.json({ success: true, message: 'Hotel archived' });
});
