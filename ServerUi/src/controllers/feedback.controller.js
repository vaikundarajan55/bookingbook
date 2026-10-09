import { FeedbackModel } from '../models/Feedback.model.js';
import { HotelModel } from '../models/Hotel.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../utils/validate.js';
import { emitToAdmins, SOCKET_EVENTS } from '../sockets/index.js';

export const createFeedback = asyncHandler(async (req, res) => {
  validate(req.body, {
    hotel_id: { type: 'number' },
    rating: { required: true, type: 'number', min: 1, max: 5 },
    comment: { required: true, minLength: 5, maxLength: 2000 },
  });
  const { hotel_id: hotelId, rating, comment } = req.body;
  if (hotelId && !(await HotelModel.findById(hotelId))) throw ApiError.badRequest('Validation failed', { hotel_id: 'Choose an existing hotel' });

  const feedback = await FeedbackModel.create({ userId: req.user.id, hotelId, rating: Math.round(Number(rating)), comment: comment.trim() });
  emitToAdmins(SOCKET_EVENTS.FEEDBACK_NEW, feedback);
  res.status(201).json({ success: true, data: feedback });
});

export const listFeedback = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await FeedbackModel.list(req.query) });
});

export const updateFeedbackStatus = asyncHandler(async (req, res) => {
  validate(req.body, { status: { required: true, oneOf: ['new', 'reviewed'] } });
  if (!(await FeedbackModel.findById(req.params.id))) throw ApiError.notFound('Feedback not found');
  res.json({ success: true, data: await FeedbackModel.setStatus(req.params.id, req.body.status) });
});

export const deleteFeedback = asyncHandler(async (req, res) => {
  if (!(await FeedbackModel.findById(req.params.id))) throw ApiError.notFound('Feedback not found');
  await FeedbackModel.remove(req.params.id);
  res.json({ success: true, message: 'Feedback deleted' });
});
