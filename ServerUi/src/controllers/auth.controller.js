import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env, isAllowedOrigin } from '../config/env.js';
import { mailConfigured, sendMail } from '../utils/mailer.js';
import { UserModel } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/token.js';
import { validate } from '../utils/validate.js';

const toAuthResponse = (user) => ({
  success: true,
  token: signToken(user),
  user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
});

export const register = asyncHandler(async (req, res) => {
  validate(req.body, {
    name: { required: true, minLength: 2 },
    email: { required: true, type: 'email' },
    password: { required: true, minLength: 8, maxLength: 100 },
  });
  const { name, email, phone, password } = req.body;
  if (await UserModel.findByEmail(email)) throw ApiError.conflict('An account with this email already exists');

  const user = await UserModel.create({ name, email, phone, passwordHash: await bcrypt.hash(password, 10) });
  res.status(201).json(toAuthResponse(user));
});

const makeLogin = (allowedRoles) => asyncHandler(async (req, res) => {
  validate(req.body, { email: { required: true, type: 'email' }, password: { required: true } });
  const user = await UserModel.findByEmail(req.body.email);
  const valid = user && (await bcrypt.compare(req.body.password, user.password_hash));
  if (!valid) throw ApiError.unauthorized('Email or password is incorrect');
  if (!user.is_active) throw ApiError.forbidden('This account has been disabled');
  if (!allowedRoles.includes(user.role)) throw ApiError.forbidden('This account cannot sign in here');
  res.json(toAuthResponse(user));
});

export const login = makeLogin(['guest', 'admin']);
export const adminLogin = makeLogin(['admin']);

export const changePassword = asyncHandler(async (req, res) => {
  validate(req.body, {
    current_password: { required: true },
    new_password: { required: true, minLength: 8, maxLength: 100 },
  });
  const { current_password: current, new_password: next } = req.body;
  const user = await UserModel.findByEmail(req.user.email);
  // 400 rather than 401 so the client does not treat a typo as an expired session
  if (!(await bcrypt.compare(current, user.password_hash))) throw ApiError.badRequest('Validation failed', { current_password: 'Current password is incorrect' });
  if (current === next) throw ApiError.badRequest('Validation failed', { new_password: 'Choose a password different from the current one' });

  await UserModel.setPassword(user.id, await bcrypt.hash(next, 10));
  res.json({ success: true, message: 'Password changed' });
});

const RESET_MINUTES = 30;
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/** Always answers the same way so the form cannot be used to discover which emails have accounts. */
export const forgotPassword = asyncHandler(async (req, res) => {
  validate(req.body, { email: { required: true, type: 'email' } });
  const user = await UserModel.findByEmail(req.body.email.trim());
  const response = { success: true, message: 'If an account exists for that email, we have sent a link to reset the password.' };

  if (user && user.is_active && user.role === 'guest') {
    const token = crypto.randomBytes(32).toString('hex');
    await UserModel.createResetToken(user.id, hashToken(token), RESET_MINUTES);
    // Link back to the address the guest is using (localhost or this PC's IP), if it is one we trust
    const origin = isAllowedOrigin(req.get('origin')) ? req.get('origin') : env.clientUrls[0];
    const link = `${origin}/reset-password?token=${token}`;
    await sendMail({
      to: user.email,
      subject: 'Reset your Harbourline password',
      text: `Hi ${user.name},

Use this link to choose a new password. It works once and expires in ${RESET_MINUTES} minutes:
${link}

If you did not ask for this, you can ignore this email.`,
    });
    // Without a mail server, development shows the link on screen so the flow can be tested
    if (!mailConfigured && env.nodeEnv === 'development') response.dev_reset_url = link;
  }
  res.json(response);
});

export const resetPassword = asyncHandler(async (req, res) => {
  validate(req.body, { token: { required: true }, password: { required: true, minLength: 8, maxLength: 100 } });
  const reset = await UserModel.findValidReset(hashToken(String(req.body.token)));
  if (!reset) throw ApiError.badRequest('This reset link is invalid or has expired. Request a new one.');
  await UserModel.setPassword(reset.user_id, await bcrypt.hash(req.body.password, 10));
  await UserModel.consumeReset(reset.id);
  res.json({ success: true, message: 'Password updated. You can sign in now.' });
});

export const updateProfile = asyncHandler(async (req, res) => {
  validate(req.body, { name: { required: true, minLength: 2, maxLength: 120 }, phone: { maxLength: 30 } });
  const user = await UserModel.updateProfile(req.user.id, { name: req.body.name.trim(), phone: req.body.phone?.trim() });
  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});
