import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import PageLoader from '../../components/ui/PageLoader.jsx';
import PageTransition from '../../components/ui/PageTransition.jsx';
import useWebsiteSocket from '../hooks/useWebsiteSocket.js';
import { logout } from '../store/authSlice.js';
import { WEB_TOKEN_KEY } from '../services/api.js';

export default function WebsiteLayout() {
  const location = useLocation();
  const dispatch = useDispatch();
  useWebsiteSocket();

  useEffect(() => { window.scrollTo({ top: 0 }); }, [location.pathname]);

  useEffect(() => {
    const onExpired = (e) => e.detail === WEB_TOKEN_KEY && dispatch(logout());
    window.addEventListener('session:expired', onExpired);
    return () => window.removeEventListener('session:expired', onExpired);
  }, [dispatch]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Suspense fallback={<PageLoader />}><Outlet /></Suspense>
          </PageTransition>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
