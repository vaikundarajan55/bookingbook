import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function RequireAdmin({ children }) {
  const { token, user } = useSelector((s) => s.adminAuth);
  if (!token || user?.role !== 'admin') return <Navigate to="/admin/login" replace />;
  return children;
}
