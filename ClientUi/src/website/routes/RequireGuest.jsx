import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function RequireGuest({ children }) {
  const token = useSelector((s) => s.webAuth.token);
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  return children;
}
