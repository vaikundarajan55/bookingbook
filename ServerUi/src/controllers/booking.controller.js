import { BookingModel, nightsBetween } from '../models/Booking.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../utils/validate.js';
import { emitToAdmins, emitToUser, SOCKET_EVENTS } from '../sockets/index.js';

const STATUSES = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'];
const TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled'],
  checked_in: ['checked_out'],
  checked_out: [],
  cancelled: [],
};

export const createBooking = asyncHandler(async (req, res) => {
  validate(req.body, {
    room_id: { required: true, type: 'number' },
    check_in: { required: true, type: 'date' },
    check_out: { required: true, type: 'date' },
    guests: { required: true, type: 'number', min: 1 },
  });
  const { room_id, check_in, check_out, guests, notes } = req.body;

  const today = new Date().toISOString().slice(0, 10);
  if (check_in < today) throw ApiError.badRequest('Check-in date cannot be in the past');
  if (nightsBetween(check_in, check_out) < 1) throw ApiError.badRequest('Check-out must be after check-in');

  const booking = await BookingModel.create({
    userId: req.user.id, roomId: room_id, checkIn: check_in, checkOut: check_out, guests: Number(guests), notes,
  });
  emitToAdmins(SOCKET_EVENTS.BOOKING_NEW, booking);
  res.status(201).json({ success: true, data: booking });
});

const MAX_CART_ITEMS = 10;

/** Checkout: books every cart item in one transaction (all or nothing). */
export const checkout = asyncHandler(async (req, res) => {
  const { items, notes } = req.body;
  if (!Array.isArray(items) || !items.length) throw ApiError.badRequest('Your cart is empty');
  if (items.length > MAX_CART_ITEMS) throw ApiError.badRequest(`You can book up to ${MAX_CART_ITEMS} rooms at once`);
  validate({ notes }, { notes: { maxLength: 500 } });

  const today = new Date().toISOString().slice(0, 10);
  const prepared = items.map((item, i) => {
    validate(item, {
      room_id: { required: true, type: 'number' },
      check_in: { required: true, type: 'date' },
      check_out: { required: true, type: 'date' },
      guests: { required: true, type: 'number', min: 1 },
    });
    if (item.check_in < today) throw ApiError.badRequest(`Stay ${i + 1}: check-in date cannot be in the past`);
    if (nightsBetween(item.check_in, item.check_out) < 1) throw ApiError.badRequest(`Stay ${i + 1}: check-out must be after check-in`);
    return { userId: req.user.id, roomId: Number(item.room_id), checkIn: item.check_in, checkOut: item.check_out, guests: Number(item.guests), notes };
  });

  const bookings = await BookingModel.createMany(prepared);
  bookings.forEach((booking) => emitToAdmins(SOCKET_EVENTS.BOOKING_NEW, booking));
  res.status(201).json({ success: true, data: bookings });
});

export const myBookings = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await BookingModel.listByUser(req.user.id) });
});

export const allBookings = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await BookingModel.listAll(req.query) });
});

const applyStatus = async (booking, status) => {
  if (!TRANSITIONS[booking.status].includes(status)) {
    throw ApiError.badRequest(`A ${booking.status.replace('_', ' ')} booking cannot be changed to ${status.replace('_', ' ')}`);
  }
  const updated = await BookingModel.updateStatus(booking.id, status);
  emitToUser(updated.user_id, SOCKET_EVENTS.BOOKING_UPDATED, updated);
  emitToAdmins(SOCKET_EVENTS.BOOKING_UPDATED, updated);
  return updated;
};

export const updateBookingStatus = asyncHandler(async (req, res) => {
  validate(req.body, { status: { required: true, oneOf: STATUSES } });
  const booking = await BookingModel.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found');
  res.json({ success: true, data: await applyStatus(booking, req.body.status) });
});

export const cancelMyBooking = asyncHandler(async (req, res) => {
  const booking = await BookingModel.findById(req.params.id);
  if (!booking || booking.user_id !== req.user.id) throw ApiError.notFound('Booking not found');
  res.json({ success: true, data: await applyStatus(booking, 'cancelled') });
});
