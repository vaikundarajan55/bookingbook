import { BookingModel } from '../models/Booking.model.js';
import { PaymentModel } from '../models/Payment.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../utils/validate.js';
import { emitToAdmins, emitToUser, SOCKET_EVENTS } from '../sockets/index.js';

const METHODS = ['card', 'upi', 'netbanking'];

// Test cards that fail, keyed by last 4 digits (same numbers as Stripe's test cards; the list is
// shown on the website payment page). Any other card that passes the checksum succeeds.
const CARD_FAILURES = {
  '0002': 'Your card was declined by the issuing bank.',
  9995: 'Insufficient funds on this card.',
  '0069': 'This card has expired.',
  '0127': 'The security code (CVV) is incorrect.',
  '0119': 'The bank could not process this payment. Please try again.',
};

/**
 * DEMO GATEWAY. No money moves and no card data reaches this server (the client sends only the last 4 digits).
 * Failures: the CARD_FAILURES cards above, UPI id "fail@upi", net banking bank "FAIL".
 * Replace `simulateGateway` with a real provider (Razorpay, Stripe…) to take live payments.
 */
const simulateGateway = ({ method, card_last4: last4, upi_id: upi, bank }) => {
  if (method === 'card' && CARD_FAILURES[last4]) return CARD_FAILURES[last4];
  if (method === 'upi' && String(upi).toLowerCase() === 'fail@upi') return 'The UPI request was declined.';
  if (method === 'netbanking' && bank === 'FAIL') return 'The bank could not authorise this payment.';
  return null;
};

export const createPayment = asyncHandler(async (req, res) => {
  validate(req.body, {
    method: { required: true, oneOf: METHODS },
    card_last4: { maxLength: 4 },
    upi_id: { maxLength: 100 },
    bank: { maxLength: 40 },
  });
  if (req.body.method === 'card' && !/^\d{4}$/.test(req.body.card_last4 || '')) throw ApiError.badRequest('Validation failed', { card_last4: 'Card details are incomplete' });
  if (req.body.method === 'upi' && !/^[\w.-]+@[\w]+$/.test(req.body.upi_id || '')) throw ApiError.badRequest('Validation failed', { upi_id: 'Enter a valid UPI ID, like name@bank' });
  if (req.body.method === 'netbanking' && !req.body.bank) throw ApiError.badRequest('Validation failed', { bank: 'Choose your bank' });

  const ids = [...new Set((req.body.booking_ids || []).map(Number).filter(Boolean))];
  if (!ids.length) throw ApiError.badRequest('Nothing to pay for');
  const bookings = await BookingModel.findPayable(req.user.id, ids);
  if (bookings.length !== ids.length) throw ApiError.badRequest('Some of these bookings are already paid, cancelled or not yours. Refresh and try again.');

  const amount = bookings.reduce((sum, b) => sum + Number(b.total_price), 0);
  const failureReason = simulateGateway(req.body);
  const payment = await PaymentModel.create({
    userId: req.user.id, amount, method: req.body.method, status: failureReason ? 'failed' : 'success',
    failureReason, bookingIds: ids, cardLast4: req.body.method === 'card' ? req.body.card_last4 : null,
  });

  if (!failureReason) {
    const updated = await BookingModel.markPaid(ids, req.body.method, payment.reference);
    updated.forEach((b) => { emitToUser(b.user_id, SOCKET_EVENTS.BOOKING_UPDATED, b); emitToAdmins(SOCKET_EVENTS.BOOKING_UPDATED, b); });
  }
  // 200 for both outcomes: a declined payment is a normal result, not a request error
  res.json({ success: true, data: payment });
});

export const getPayment = asyncHandler(async (req, res) => {
  const payment = await PaymentModel.findByReference(req.params.reference);
  if (!payment || payment.user_id !== req.user.id) throw ApiError.notFound('Payment not found');
  const bookings = await Promise.all(payment.booking_ids.map((id) => BookingModel.findById(id)));
  res.json({ success: true, data: { ...payment, bookings: bookings.filter(Boolean) } });
});
