import { Server } from 'socket.io';
import { corsOrigin } from '../config/env.js';
import { verifyToken } from '../utils/token.js';
import { UserModel } from '../models/User.model.js';

let io = null;

export const SOCKET_EVENTS = {
  BOOKING_NEW: 'booking:new',
  BOOKING_UPDATED: 'booking:updated',
  ROOM_CHANGED: 'room:changed',
  HOTEL_CHANGED: 'hotel:changed',
  FEEDBACK_NEW: 'feedback:new',
  ENQUIRY_NEW: 'enquiry:new',
  PRESENCE: 'presence:update',
};

const adminRoom = 'admins';
const userRoom = (id) => `user:${id}`;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, { cors: { origin: corsOrigin, credentials: true } });

  // Authentication is optional so guests can still receive public `room:changed` events.
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next();
    try {
      const payload = verifyToken(token);
      const user = await UserModel.findById(payload.id);
      if (user?.is_active) socket.data.user = user;
      return next();
    } catch {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket.data;
    if (user) {
      socket.join(userRoom(user.id));
      if (user.role === 'admin') socket.join(adminRoom);
    }
    broadcastPresence();
    socket.on('disconnect', broadcastPresence);
  });

  return io;
};

const broadcastPresence = () => {
  if (!io) return;
  io.to(adminRoom).emit(SOCKET_EVENTS.PRESENCE, { online: io.engine.clientsCount });
};

export const emitToAdmins = (event, payload) => io?.to(adminRoom).emit(event, payload);
export const emitToUser = (userId, event, payload) => io?.to(userRoom(userId)).emit(event, payload);
export const emitToAll = (event, payload) => io?.emit(event, payload);
