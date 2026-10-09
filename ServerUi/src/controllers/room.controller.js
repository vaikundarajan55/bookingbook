import { HotelModel } from '../models/Hotel.model.js';
import { RoomModel } from '../models/Room.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../utils/validate.js';
import { emitToAll, SOCKET_EVENTS } from '../sockets/index.js';

const ROOM_TYPES = ['standard', 'deluxe', 'suite', 'family'];

const assertHotelExists = async (hotelId) => {
  if (hotelId !== undefined && !(await HotelModel.findById(hotelId))) throw ApiError.badRequest('Validation failed', { hotel_id: 'Choose an existing hotel' });
};

export const listRooms = asyncHandler(async (req, res) => {
  const isAdminView = req.user?.role === 'admin' && req.query.includeInactive === 'true';
  const rooms = await RoomModel.list({ ...req.query, includeInactive: isAdminView });
  res.json({ success: true, data: rooms });
});

export const getRoom = asyncHandler(async (req, res) => {
  const room = await RoomModel.findById(req.params.id);
  if (!room) throw ApiError.notFound('Room not found');
  res.json({ success: true, data: room });
});

export const createRoom = asyncHandler(async (req, res) => {
  validate(req.body, {
    hotel_id: { required: true, type: 'number' },
    name: { required: true, minLength: 2 },
    type: { required: true, oneOf: ROOM_TYPES },
    price_per_night: { required: true, type: 'number', min: 1 },
    capacity: { type: 'number', min: 1, max: 12 },
  });
  await assertHotelExists(req.body.hotel_id);
  const room = await RoomModel.create(req.body);
  emitToAll(SOCKET_EVENTS.ROOM_CHANGED, { action: 'created', room });
  res.status(201).json({ success: true, data: room });
});

export const updateRoom = asyncHandler(async (req, res) => {
  validate(req.body, {
    hotel_id: { type: 'number' },
    type: { oneOf: ROOM_TYPES },
    price_per_night: { type: 'number', min: 1 },
    capacity: { type: 'number', min: 1, max: 12 },
  });
  if (!(await RoomModel.findById(req.params.id))) throw ApiError.notFound('Room not found');
  await assertHotelExists(req.body.hotel_id);
  const room = await RoomModel.update(req.params.id, req.body);
  emitToAll(SOCKET_EVENTS.ROOM_CHANGED, { action: 'updated', room });
  res.json({ success: true, data: room });
});

export const deleteRoom = asyncHandler(async (req, res) => {
  if (!(await RoomModel.findById(req.params.id))) throw ApiError.notFound('Room not found');
  await RoomModel.archive(req.params.id);
  emitToAll(SOCKET_EVENTS.ROOM_CHANGED, { action: 'archived', id: Number(req.params.id) });
  res.json({ success: true, message: 'Room archived' });
});
