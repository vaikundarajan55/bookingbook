import { lazy } from 'react';

// Every admin page is its own chunk; guests never download any of this code.
export const AdminLogin = lazy(() => import('../pages/AdminLogin.jsx'));
export const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));
export const HotelsManager = lazy(() => import('../pages/HotelsManager.jsx'));
export const RoomsManager = lazy(() => import('../pages/RoomsManager.jsx'));
export const BookingsManager = lazy(() => import('../pages/BookingsManager.jsx'));
export const EmployeesManager = lazy(() => import('../pages/EmployeesManager.jsx'));
export const InvoicesManager = lazy(() => import('../pages/InvoicesManager.jsx'));
export const InvoiceView = lazy(() => import('../pages/InvoiceView.jsx'));
export const FeedbackManager = lazy(() => import('../pages/FeedbackManager.jsx'));
export const EnquiriesManager = lazy(() => import('../pages/EnquiriesManager.jsx'));
export const ChangePassword = lazy(() => import('../pages/ChangePassword.jsx'));
export const UsersManager = lazy(() => import('../pages/UsersManager.jsx'));
