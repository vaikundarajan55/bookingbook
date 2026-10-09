import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import WebsiteLayout from '../layouts/WebsiteLayout.jsx';
import PageLoader from '../../components/ui/PageLoader.jsx';
import RequireGuest from './RequireGuest.jsx';
import {
  AccountBookings, AccountDashboard, AccountLayout, Cart, ChangePassword, Checkout, Contact, Feedback, ForgotPassword, Home,
  Invoice, Login, NotFound, Payment, PaymentResult, Profile, Register, ResetPassword, RoomDetails, Rooms,
} from './lazyPages.js';

export default function WebsiteRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<WebsiteLayout />}>
          <Route index element={<Home />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="rooms/:id" element={<RoomDetails />} />
          <Route path="contact" element={<Contact />} />
          <Route path="feedback" element={<RequireGuest><Feedback /></RequireGuest>} />

          {/* Booking flow: the cart is open to everyone; checkout onwards needs an account */}
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<RequireGuest><Checkout /></RequireGuest>} />
          <Route path="payment" element={<RequireGuest><Payment /></RequireGuest>} />
          <Route path="payment/success" element={<RequireGuest><PaymentResult outcome="success" /></RequireGuest>} />
          <Route path="payment/failed" element={<RequireGuest><PaymentResult outcome="failed" /></RequireGuest>} />

          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />

          <Route path="account" element={<RequireGuest><AccountLayout /></RequireGuest>}>
            <Route index element={<AccountDashboard />} />
            <Route path="bookings" element={<AccountBookings />} />
            <Route path="bookings/:id/invoice" element={<Invoice />} />
            <Route path="profile" element={<Profile />} />
            <Route path="change-password" element={<ChangePassword />} />
          </Route>
          <Route path="my-bookings" element={<Navigate to="/account/bookings" replace />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
