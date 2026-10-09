import { ApiError } from '../utils/ApiError.js';
import { verifyToken } from '../utils/token.js';
import { UserModel } from '../models/User.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw ApiError.unauthorized();

  let payload;
  try { payload = verifyToken(token); } catch { throw ApiError.unauthorized('Session expired. Please sign in again.'); }

  const user = await UserModel.findById(payload.id);
  if (!user || !user.is_active) throw ApiError.unauthorized('Account is not available');
  req.user = user;
  next();
});

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(ApiError.forbidden());
  return next();
};
