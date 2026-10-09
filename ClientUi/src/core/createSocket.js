import { io } from 'socket.io-client';

// Empty = connect to the host the page was opened on (the dev server forwards /socket.io to the backend)
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined;

export const SOCKET_EVENTS = {
  BOOKING_NEW: 'booking:new',
  BOOKING_UPDATED: 'booking:updated',
  ROOM_CHANGED: 'room:changed',
  HOTEL_CHANGED: 'hotel:changed',
  FEEDBACK_NEW: 'feedback:new',
  ENQUIRY_NEW: 'enquiry:new',
  PRESENCE: 'presence:update',
};

export const createSocket = (token) =>
  io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'], reconnectionDelayMax: 8000 });
