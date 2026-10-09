import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout.jsx';
import PageLoader from '../../components/ui/PageLoader.jsx';
import RequireAdmin from './RequireAdmin.jsx';
import {
  AdminLogin, BookingsManager, ChangePassword, Dashboard, EmployeesManager, EnquiriesManager, FeedbackManager,
  HotelsManager, InvoicesManager, InvoiceView, RoomsManager, UsersManager,
} from './lazyPages.js';

export default function AdminRoutes() {
  return (
    // .admin-theme swaps in the teal dashboard palette and typography for every admin screen
    <div className="admin-theme min-h-screen bg-mist text-ink">
      <Suspense fallback={<PageLoader label="Loading admin" />}>
        <Routes>
          <Route path="login" element={<AdminLogin />} />
          <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route index element={<Dashboard />} />
            <Route path="hotels" element={<HotelsManager />} />
            <Route path="rooms" element={<RoomsManager />} />
            <Route path="bookings" element={<BookingsManager />} />
            <Route path="users" element={<UsersManager />} />
            <Route path="employees" element={<EmployeesManager />} />
            <Route path="invoices" element={<InvoicesManager />} />
            <Route path="invoices/:id" element={<InvoiceView />} />
            <Route path="feedback" element={<FeedbackManager />} />
            <Route path="enquiries" element={<EnquiriesManager />} />
            <Route path="change-password" element={<ChangePassword />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}
