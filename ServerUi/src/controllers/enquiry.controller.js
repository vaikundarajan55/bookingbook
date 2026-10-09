import { EnquiryModel } from '../models/Enquiry.model.js';
import { HotelModel } from '../models/Hotel.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../utils/validate.js';
import { emitToAdmins, SOCKET_EVENTS } from '../sockets/index.js';

const STATUSES = ['new', 'in_progress', 'closed'];

// Public: anyone can send an enquiry from the website contact page
export const createEnquiry = asyncHandler(async (req, res) => {
  validate(req.body, {
    name: { required: true, minLength: 2, maxLength: 120 },
    email: { required: true, type: 'email', maxLength: 160 },
    phone: { maxLength: 30 },
    hotel_id: { type: 'number' },
    subject: { required: true, minLength: 3, maxLength: 160 },
    message: { required: true, minLength: 10, maxLength: 3000 },
  });
  const { name, email, phone, hotel_id: hotelId, subject, message } = req.body;
  if (hotelId && !(await HotelModel.findById(hotelId))) throw ApiError.badRequest('Validation failed', { hotel_id: 'Choose an existing hotel' });

  const enquiry = await EnquiryModel.create({
    name: name.trim(), email: email.trim(), phone: phone?.trim(), hotelId, subject: subject.trim(), message: message.trim(),
  });
  emitToAdmins(SOCKET_EVENTS.ENQUIRY_NEW, enquiry);
  res.status(201).json({ success: true, message: 'Thanks! Our team will get back to you shortly.' });
});

export const listEnquiries = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await EnquiryModel.list(req.query) });
});

export const updateEnquiryStatus = asyncHandler(async (req, res) => {
  validate(req.body, { status: { required: true, oneOf: STATUSES } });
  if (!(await EnquiryModel.findById(req.params.id))) throw ApiError.notFound('Enquiry not found');
  res.json({ success: true, data: await EnquiryModel.setStatus(req.params.id, req.body.status) });
});

export const deleteEnquiry = asyncHandler(async (req, res) => {
  if (!(await EnquiryModel.findById(req.params.id))) throw ApiError.notFound('Enquiry not found');
  await EnquiryModel.remove(req.params.id);
  res.json({ success: true, message: 'Enquiry deleted' });
});
