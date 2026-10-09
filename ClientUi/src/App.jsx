import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import PageLoader from './components/ui/PageLoader.jsx';

// Two completely separate bundles: visitors never download admin code and vice versa.
const WebsiteRoutes = lazy(() => import('./website/routes/WebsiteRoutes.jsx'));
const AdminRoutes = lazy(() => import('./admin/routes/AdminRoutes.jsx'));

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/*" element={<WebsiteRoutes />} />
      </Routes>
    </Suspense>
  );
}
