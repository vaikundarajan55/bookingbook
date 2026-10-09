import { UserModel } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listUsers = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await UserModel.list(req.query) });
});

export const toggleUserActive = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (user.role === 'admin') throw ApiError.forbidden('Admin accounts cannot be disabled here');
  res.json({ success: true, data: await UserModel.setActive(user.id, !user.is_active) });
});
