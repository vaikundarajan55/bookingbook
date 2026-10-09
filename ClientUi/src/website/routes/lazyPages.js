import { lazy } from 'react';

// Every website page is its own chunk, downloaded only when the route is visited.
export const Home = lazy(() => import('../pages/Home.jsx'));
export const Rooms = lazy(() => import('../pages/Rooms.jsx'));
export const RoomDetails = lazy(() => import('../pages/RoomDetails.jsx'));
export const Cart = lazy(() => import('../pages/Cart.jsx'));
export const Checkout = lazy(() => import('../pages/Checkout.jsx'));
export const Payment = lazy(() => import('../pages/Payment.jsx'));
export const PaymentResult = lazy(() => import('../pages/PaymentResult.jsx'));
export const Login = lazy(() => import('../pages/Login.jsx'));
export const Register = lazy(() => import('../pages/Register.jsx'));
export const ForgotPassword = lazy(() => import('../pages/ForgotPassword.jsx'));
export const ResetPassword = lazy(() => import('../pages/ResetPassword.jsx'));
export const Contact = lazy(() => import('../pages/Contact.jsx'));
export const Feedback = lazy(() => import('../pages/Feedback.jsx'));
export const NotFound = lazy(() => import('../pages/NotFound.jsx'));

// Signed-in guest account area
export const AccountLayout = lazy(() => import('../layouts/AccountLayout.jsx'));
export const AccountDashboard = lazy(() => import('../pages/account/AccountDashboard.jsx'));
export const AccountBookings = lazy(() => import('../pages/account/AccountBookings.jsx'));
export const Profile = lazy(() => import('../pages/account/Profile.jsx'));
export const ChangePassword = lazy(() => import('../pages/account/ChangePassword.jsx'));
export const Invoice = lazy(() => import('../pages/account/Invoice.jsx'));
