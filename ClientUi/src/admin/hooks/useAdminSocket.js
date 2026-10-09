import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { createSocket, SOCKET_EVENTS } from '../../core/createSocket.js';
import { formatDate, statusLabel } from '../../core/format.js';
import { bookingAddedLive, bookingUpdatedLive } from '../store/adminBookingSlice.js';
import { feedbackAddedLive } from '../store/adminFeedbackSlice.js';
import { enquiryAddedLive } from '../store/adminEnquirySlice.js';
import { notificationAdded } from '../store/notificationSlice.js';
import { fetchDashboard, presenceUpdated, socketStatusChanged } from '../store/dashboardSlice.js';

/** Admin socket: new bookings, feedback and enquiries arrive instantly (toast + header bell), plus presence. */
export default function useAdminSocket() {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.adminAuth.token);

  useEffect(() => {
    if (!token) return undefined;
    const socket = createSocket(token);

    socket.on('connect', () => dispatch(socketStatusChanged(true)));
    socket.on('disconnect', () => dispatch(socketStatusChanged(false)));
    socket.on(SOCKET_EVENTS.PRESENCE, (payload) => dispatch(presenceUpdated(payload)));

    socket.on(SOCKET_EVENTS.BOOKING_NEW, (booking) => {
      dispatch(bookingAddedLive(booking));
      dispatch(fetchDashboard());
      const text = `${booking.guest_name} · ${booking.room_name} · ${formatDate(booking.check_in)}`;
      dispatch(notificationAdded({ type: 'booking', title: 'New booking', text, to: '/admin/bookings' }));
      toast(`New booking: ${text}`, { icon: '🔔', duration: 6000 });
    });

    socket.on(SOCKET_EVENTS.BOOKING_UPDATED, (booking) => {
      dispatch(bookingUpdatedLive(booking));
      dispatch(fetchDashboard());
      if (booking.status === 'cancelled') {
        dispatch(notificationAdded({ type: 'cancel', title: 'Booking cancelled', text: `${booking.reference} · ${booking.guest_name}`, to: '/admin/bookings' }));
        toast(`${booking.reference} was cancelled (${booking.guest_name})`, { icon: '⚠️' });
      } else if (booking.status === 'pending') toast(`${booking.reference} is ${statusLabel(booking.status).toLowerCase()}`);
    });

    socket.on(SOCKET_EVENTS.FEEDBACK_NEW, (feedback) => {
      dispatch(feedbackAddedLive(feedback));
      dispatch(notificationAdded({ type: 'feedback', title: `${feedback.rating}-star feedback`, text: `from ${feedback.guest_name}`, to: '/admin/feedback' }));
      toast(`New feedback: ${'★'.repeat(feedback.rating)} from ${feedback.guest_name}`, { icon: '💬', duration: 6000 });
    });

    socket.on(SOCKET_EVENTS.ENQUIRY_NEW, (enquiry) => {
      dispatch(enquiryAddedLive(enquiry));
      dispatch(fetchDashboard());
      dispatch(notificationAdded({ type: 'enquiry', title: 'New enquiry', text: `${enquiry.name}: ${enquiry.subject}`, to: '/admin/enquiries' }));
      toast(`New enquiry from ${enquiry.name}: ${enquiry.subject}`, { icon: '✉️', duration: 6000 });
    });

    return () => { socket.disconnect(); dispatch(socketStatusChanged(false)); };
  }, [token, dispatch]);
}
