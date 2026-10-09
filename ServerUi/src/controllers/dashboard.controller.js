import { BookingModel } from '../models/Booking.model.js';
import { RoomModel } from '../models/Room.model.js';
import { UserModel } from '../models/User.model.js';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboard = asyncHandler(async (_req, res) => {
  const [stats, totalRooms, guests, [enquiries], [feedback]] = await Promise.all([
    BookingModel.stats(),
    RoomModel.count(),
    UserModel.list({ role: 'guest' }),
    query("SELECT COUNT(*) AS total, COALESCE(SUM(status = 'new'), 0) AS open FROM enquiries"),
    query('SELECT COUNT(*) AS total, COALESCE(AVG(rating), 0) AS average FROM feedback'),
  ]);
  res.json({
    success: true,
    data: {
      ...stats,
      totalRooms,
      totalGuests: guests.length,
      availableRooms: Math.max(totalRooms - stats.occupiedToday, 0),
      enquiries: { total: Number(enquiries.total), new: Number(enquiries.open) },
      feedback: { total: Number(feedback.total), average: Math.round(Number(feedback.average) * 10) / 10 },
      occupancyRate: totalRooms ? Math.round((stats.occupiedToday / totalRooms) * 100) : 0,
    },
  });
});
