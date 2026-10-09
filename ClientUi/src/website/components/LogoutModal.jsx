import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { LogOut } from 'lucide-react';
import Modal from '../../components/ui/Modal.jsx';
import { logout } from '../store/authSlice.js';
import { clearBookings } from '../store/bookingSlice.js';

/** Confirm, then sign the guest out. The cart is kept: it belongs to this browser, not the account. */
export default function LogoutModal({ open, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const signOut = () => {
    dispatch(logout());
    dispatch(clearBookings());
    onClose();
    toast.success('You are signed out');
    navigate('/');
  };

  return (
    <Modal open={open} onClose={onClose} title="Log out?" size="sm"
      footer={<><button className="btn-ghost" onClick={onClose}>Stay signed in</button><button className="btn-danger" onClick={signOut}><LogOut size={16} /> Logout</button></>}>
      <p className="text-sm text-ink/70">You can sign back in any time to see your bookings and invoices.</p>
    </Modal>
  );
}
