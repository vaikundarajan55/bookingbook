import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export const notFound = (req, _res, next) => next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  const status = err.statusCode || (err.code === 'ER_DUP_ENTRY' ? 409 : 500);
  const message = err.code === 'ER_DUP_ENTRY' ? 'A record with these details already exists' : err.message;
  if (status >= 500) console.error(err);
  res.status(status).json({
    success: false,
    message: status >= 500 && env.nodeEnv === 'production' ? 'Something went wrong on our side' : message,
    details: err.details ?? undefined,
    stack: env.nodeEnv === 'development' && status >= 500 ? err.stack : undefined,
  });
};
