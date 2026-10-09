import { useEffect } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import toast from 'react-hot-toast';
import { createSocket, SOCKET_EVENTS } from '../../core/createSocket.js';
import { statusLabel } from '../../core/format.js';
import { bookingUpdatedLive } from '../store/bookingSlice.js';
import { refreshRooms } from '../store/roomSlice.js';

/** Website socket: public room changes + the signed-in guest's own booking updates. */
export default function useWebsiteSocket() {
  const dispatch = useDispatch();
  const store = useStore();
  const token = useSelector((s) => s.webAuth.token);

  useEffect(() => {
    const socket = createSocket(token);

    socket.on(SOCKET_EVENTS.ROOM_CHANGED, () => dispatch(refreshRooms()));
    socket.on(SOCKET_EVENTS.BOOKING_UPDATED, (booking) => {
      const previous = store.getState().webBookings.items.find((b) => b.id === booking.id);
      dispatch(bookingUpdatedLive(booking));
      // Payments also emit updates; only announce real status changes (the payment pages report payments)
      if (previous?.status === booking.status) return;
      toast(`Booking ${booking.reference} is now ${statusLabel(booking.status).toLowerCase()}`, { icon: '🛎️' });
    });

    return () => socket.disconnect();
  }, [token, dispatch, store]);
}
