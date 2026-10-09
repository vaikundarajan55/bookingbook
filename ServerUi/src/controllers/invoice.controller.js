import { BookingModel, nightsBetween } from '../models/Booking.model.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../utils/validate.js';

const PAYMENT_METHODS = ['cash', 'card', 'upi', 'bank_transfer'];
const round2 = (n) => Math.round(n * 100) / 100;

/** An invoice is a view of a booking: prices are tax-inclusive, so tax is split out of the total. */
const toInvoice = (booking) => {
  const total = Number(booking.total_price);
  const subtotal = round2(total / (1 + env.taxRate / 100));
  return {
    ...booking,
    invoice_number: `INV-${String(booking.created_at).slice(0, 4)}-${String(booking.id).padStart(5, '0')}`,
    nights: nightsBetween(booking.check_in, booking.check_out),
    tax_rate: env.taxRate,
    subtotal,
    tax_amount: round2(total - subtotal),
    grand_total: total,
  };
};

// Cancelled bookings never get billed, so they are left out of the invoice list
export const listInvoices = asyncHandler(async (req, res) => {
  const bookings = await BookingModel.listAll({ ...req.query, status: undefined, excludeCancelled: true });
  res.json({ success: true, data: bookings.map(toInvoice) });
});

export const getInvoice = asyncHandler(async (req, res) => {
  const booking = await BookingModel.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Invoice not found');
  res.json({ success: true, data: toInvoice(booking) });
});

export const getMyInvoice = asyncHandler(async (req, res) => {
  const booking = await BookingModel.findById(req.params.id);
  if (!booking || booking.user_id !== req.user.id || booking.status === 'cancelled') throw ApiError.notFound('Invoice not found');
  res.json({ success: true, data: toInvoice(booking) });
});

export const updatePayment = asyncHandler(async (req, res) => {
  validate(req.body, { payment_status: { required: true, oneOf: ['paid', 'unpaid'] } });
  if (req.body.payment_status === 'paid') validate(req.body, { payment_method: { required: true, oneOf: PAYMENT_METHODS } });

  const booking = await BookingModel.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Invoice not found');
  if (booking.status === 'cancelled') throw ApiError.badRequest('A cancelled booking cannot be marked as paid');

  const updated = await BookingModel.setPayment(booking.id, req.body.payment_status, req.body.payment_method);
  res.json({ success: true, data: toInvoice(updated) });
});
