import { Suspense, useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';
import AdminHeader from '../components/AdminHeader.jsx';
import Modal from '../../components/ui/Modal.jsx';
import PageLoader from '../../components/ui/PageLoader.jsx';
import PageTransition from '../../components/ui/PageTransition.jsx';
import useAdminSocket from '../hooks/useAdminSocket.js';
import { adminLogout } from '../store/adminAuthSlice.js';
import { notificationsCleared } from '../store/notificationSlice.js';
import { ADMIN_TOKEN_KEY } from '../services/api.js';

const COLLAPSE_KEY = 'hb_admin_sidebar_collapsed';

const CRUMBS = {
  bookings: 'All Booking', invoices: 'Invoices', users: 'Customers', hotels: 'Hotels', rooms: 'Rooms',
  employees: 'Employees', feedback: 'Feedback', enquiries: 'Enquiry', 'change-password': 'Change Password',
};

const readCollapsed = () => { try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; } };

function Breadcrumb({ pathname }) {
  const [, , section, detail] = pathname.split('/'); // '', 'admin', section, detail
  if (!section) return null; // the dashboard greets instead
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm print:hidden">
      <ol className="flex flex-wrap items-center gap-2 text-ink/60">
        <li><Link to="/admin" className="text-[#333] hover:text-ocean">Dashboard</Link></li>
        <li aria-hidden="true">/</li>
        {detail ? (
          <>
            <li><Link to={`/admin/${section}`} className="text-[#333] hover:text-ocean">{CRUMBS[section] || section}</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Details</li>
          </>
        ) : <li aria-current="page">{CRUMBS[section] || section}</li>}
      </ol>
    </nav>
  );
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useAdminSocket();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => { try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0'); } catch { /* storage unavailable */ } }, [collapsed]);

  useEffect(() => {
    const onExpired = (e) => {
      if (e.detail !== ADMIN_TOKEN_KEY) return;
      dispatch(adminLogout());
      navigate('/admin/login', { replace: true });
    };
    window.addEventListener('session:expired', onExpired);
    return () => window.removeEventListener('session:expired', onExpired);
  }, [dispatch, navigate]);

  const signOut = () => { dispatch(adminLogout()); dispatch(notificationsCleared()); navigate('/admin/login', { replace: true }); };

  return (
    <div className="min-h-screen bg-mist print:bg-white">
      <AdminHeader collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} onOpenMobile={() => setMobileOpen(true)} onLogout={() => setConfirmLogout(true)} />
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} onLogout={() => setConfirmLogout(true)} />

      <main className={`min-w-0 px-4 pb-10 pt-[104px] transition-[margin] duration-300 sm:px-[30px] print:m-0 print:p-0 ${collapsed ? 'lg:ml-[78px]' : 'lg:ml-[260px]'}`}>
        <Breadcrumb pathname={location.pathname} />
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Suspense fallback={<PageLoader />}><Outlet /></Suspense>
          </PageTransition>
        </AnimatePresence>
      </main>

      <Modal open={confirmLogout} onClose={() => setConfirmLogout(false)} title="Log out?" size="sm"
        footer={<><button className="btn-ghost" onClick={() => setConfirmLogout(false)}>Stay signed in</button><button className="btn-danger" onClick={signOut}><LogOut size={16} /> Logout</button></>}>
        <p className="text-sm text-ink/70">You will need your email and password to sign in to the admin console again.</p>
      </Modal>
    </div>
  );
}
