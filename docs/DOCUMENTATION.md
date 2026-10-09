# Harbourline Hotel — Full Documentation

Hotel booking **Website** + **Admin Console** (React + Tailwind) with a Node.js **MVC** API, **Socket.io** realtime and **MySQL**.

---

## 1. Contents

1. Overview and features
2. Technology stack
3. Architecture
4. Folder structure
5. Setup and run
6. Environment variables
7. Database design
8. Backend (ServerUi): MVC, API reference, sockets
9. Frontend (ClientUi): structure, Redux, lazy loading, animation design
10. Realtime flows
11. Security
12. Build and deployment
13. Testing performed
14. Troubleshooting
15. Extending the project

---

## 2. Overview and features

### Website (guests) — `/`
- Home with hero, date/guest search, featured rooms
- Booking flow: **Cart** (several rooms, saved in the browser) → **Checkout** (sign-in required; all rooms booked in ONE transaction, all-or-nothing) → **Payment** (card / UPI / net banking) → **Success** or **Failure** (retry, or pay later from My bookings)
- **Payment is a demo gateway**: no money moves and only the last 4 card digits reach the server. Test cards (shown on the payment page with a Use button): 4242 4242 4242 4242, 5555 5555 5555 4444, 3782 8224 6310 005 (Amex) and 6011 1111 1111 1117 succeed; 4000 0000 0000 0002 declined, …9995 insufficient funds, …0069 expired, …0127 incorrect CVV, …0119 processing error. UPI fail@upi fails; net banking "Test bank" fails. Replace simulateGateway() in ServerUi/src/controllers/payment.controller.js with a real provider for live payments
- Accounts: register (min 8-character password), login, forgot password (emailed one-time link, valid 30 min; without SMTP_HOST the link is logged and, in development, shown on screen), reset password
- Guest account area (/account): Dashboard (upcoming, paid, due, next stay), My bookings (tabs, Pay now, Invoice, Cancel), Profile, Change password, printable Invoice, Logout
- Rooms list with filters (type, max price, text, **available dates + guests**)
- Room details with live availability check, price calculation and animated confirm dialog
- Register / sign in
- My bookings with cancel and **live status updates** (socket)

### Admin console — `/admin`
- Separate admin sign in (guest accounts are rejected)
- Dashboard: revenue, bookings, occupancy tonight, guests, 6-month revenue chart, approval queue, latest bookings
- Bookings manager: status tabs, search, Confirm / Decline / Check in / Check out / Cancel
- Admin design follows the teal hotel-dashboard template: 80px header (teal pill search, live notification bell, account menu), white collapsible sidebar with teal active pill and Booking submenu, flat white cards, template-style login. Colours are CSS variables: the website palette lives on :root and .admin-theme (applied by AdminRoutes) swaps in the teal palette, so the website keeps its own look.
- Dashboard (animated: cards stagger in, numbers count up, lines draw in; all respect reduced-motion): KPI cards with sparklines and month-on-month trend (Revenue booked, Collected, Bookings, Occupied tonight meter); Booked vs. collected 12-month chart with crosshair tooltip; Collection rate with collected / outstanding / cancelled / average booking value; Bookings by status bars; Rooms booked donut; Guests (average rating, enquiries); latest bookings with Confirm / Decline. API: GET /dashboard returns `series` (12 zero-filled months of bookings, cancelled, booked, collected), `outstanding`, `cancelledValue`, `avgBookingValue`, `feedback`
- Sample data: `npm run db:demo` adds 10 demo guests (@demo.harbourline.example, password demo12345) with ~300 bookings over 12 months, reviews and enquiries; `npm run db:demo:clear` removes only those rows
- Hotels manager: list every hotel with its total, AC and Non-AC room counts; add, edit, hide (hiding a hotel hides all its rooms)
- Employees: staff list per hotel (designation, phone, email, salary, joined date, working / inactive) with hotel, designation and text filters
- Invoices: one per non-cancelled booking (INV-YYYY-00001), tax-inclusive breakdown (TAX_RATE in ServerUi/.env, default 12%), paid / unpaid with payment method, printable invoice page
- Users: all accounts with a Guests / Admins filter; guests can be disabled
- Feedback: star ratings and comments from signed-in guests (website /feedback), average rating, mark reviewed, delete; arrives live
- Enquiries: messages from the public contact page (website /contact) with New / In progress / Closed status, reply by email, delete; arrives live
- Change password (Account section) and Logout (sidebar and header, with confirmation)
- Rooms manager: each room belongs to a hotel and is marked **AC** or **Non-AC**; filter by hotel and AC; add, edit, hide (soft delete keeps booking history)
- Guests manager: search, enable / disable sign-in
- Live connection indicator, online-connections counter and **instant toast for new bookings**

### Rules enforced by the API
- No double booking: availability is checked inside a **transaction with a row lock** (`SELECT … FOR UPDATE`)
- Booking status flow: `pending → confirmed → checked_in → checked_out`; `pending/confirmed → cancelled`
- Guests can only cancel their own pending/confirmed bookings
- Check-in cannot be in the past, check-out must be after check-in, guests cannot exceed room capacity

---

## 3. Technology stack

| Layer | Technology |
|---|---|
| UI | React 18, Vite 5, React Router 6 |
| Styling | Tailwind CSS 3 (custom Ocean / Brass theme, Fraunces + Manrope fonts) |
| Animation | Framer Motion 11 + Tailwind keyframes (`wave`, `float`, `shimmer`, `bars`, `pulse-dot`) |
| State | Redux Toolkit — `configureStore`, `createSlice`, **`createAsyncThunk` (redux-thunk)** |
| Realtime | Socket.io 4 (client + server) |
| HTTP | Axios (one instance per area) |
| Server | Node.js 18+, **ES modules** (`import/export`), `async/await` (ES2017 / ES8+), Express 4 |
| Pattern | **MVC**: Models / Controllers / Routes (views = React app) |
| Database | MySQL 8 via `mysql2/promise` (connection pool, prepared transactions) |
| Auth | JWT (Bearer) + bcrypt password hashes, role based (`guest`, `admin`) |

---

## 4. Architecture

```
                       ┌──────────────────────── ClientUi (Vite, :5178) ────────────────────────┐
                       │  /            → website/  (lazy chunk)    webApi  + website socket     │
 Browser ────────────► │  /admin/*     → admin/    (lazy chunk)    adminApi + admin socket      │
                       │  Redux store: web* slices + admin* slices (thunks call the APIs)       │
                       └───────────────┬───────────────────────────────────┬────────────────────┘
                                  REST │ /api/*                            │ WebSocket
                       ┌───────────────▼───────────────────────────────────▼────────────────────┐
                       │                      ServerUi (Express + Socket.io, :5000)              │
                       │  routes → middlewares (auth / role) → controllers → models → MySQL      │
                       │  controllers emit socket events after writes                            │
                       └───────────────────────────────────┬────────────────────────────────────┘
                                                           │ mysql2 pool
                                                   ┌───────▼───────┐
                                                   │     MySQL     │  users · hotels · rooms · bookings · employees · feedback · enquiries
                                                   └───────────────┘
```

The website and admin share **no session**: they use different axios instances, different `localStorage` keys (`hb_web_token` / `hb_admin_token`) and different socket connections.

---

## 5. Folder structure

```
hotel-booking/
├── ClientUi/
│   ├── src/
│   │   ├── admin/
│   │   │   ├── components/
│   │   │   │   ├── RevenueChart.jsx
│   │   │   │   ├── RoomFormModal.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── StatCard.jsx
│   │   │   ├── hooks/
│   │   │   │   └── useAdminSocket.js
│   │   │   ├── layouts/
│   │   │   │   └── AdminLayout.jsx
│   │   │   ├── pages/
│   │   │   │   ├── AdminLogin.jsx
│   │   │   │   ├── BookingsManager.jsx
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── HotelsManager.jsx
│   │   │   │   ├── RoomsManager.jsx
│   │   │   │   └── UsersManager.jsx
│   │   │   ├── routes/
│   │   │   │   ├── AdminRoutes.jsx
│   │   │   │   ├── RequireAdmin.jsx
│   │   │   │   └── lazyPages.js
│   │   │   ├── services/
│   │   │   │   └── api.js
│   │   │   └── store/
│   │   │       ├── adminAuthSlice.js
│   │   │       ├── adminBookingSlice.js
│   │   │       ├── adminRoomSlice.js
│   │   │       ├── adminUserSlice.js
│   │   │       └── dashboardSlice.js
│   │   ├── components/
│   │   │   └── ui/
│   │   │       ├── EmptyState.jsx
│   │   │       ├── ErrorBoundary.jsx
│   │   │       ├── Modal.jsx
│   │   │       ├── PageLoader.jsx
│   │   │       ├── PageTransition.jsx
│   │   │       ├── Spinner.jsx
│   │   │       └── StatusBadge.jsx
│   │   ├── core/
│   │   │   ├── createApiClient.js
│   │   │   ├── createSocket.js
│   │   │   ├── format.js
│   │   │   └── storage.js
│   │   ├── store/
│   │   │   └── index.js
│   │   ├── website/
│   │   │   ├── components/
│   │   │   │   ├── AuthShell.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── RoomCard.jsx
│   │   │   │   └── SearchBar.jsx
│   │   │   ├── hooks/
│   │   │   │   └── useWebsiteSocket.js
│   │   │   ├── layouts/
│   │   │   │   └── WebsiteLayout.jsx
│   │   │   ├── pages/
│   │   │   │   ├── Home.jsx
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── MyBookings.jsx
│   │   │   │   ├── NotFound.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   ├── RoomDetails.jsx
│   │   │   │   └── Rooms.jsx
│   │   │   ├── routes/
│   │   │   │   ├── RequireGuest.jsx
│   │   │   │   ├── WebsiteRoutes.jsx
│   │   │   │   └── lazyPages.js
│   │   │   ├── services/
│   │   │   │   └── api.js
│   │   │   └── store/
│   │   │       ├── authSlice.js
│   │   │       ├── bookingSlice.js
│   │   │       └── roomSlice.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── ServerUi/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── env.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── booking.controller.js
│   │   │   ├── dashboard.controller.js
│   │   │   ├── room.controller.js
│   │   │   └── user.controller.js
│   │   ├── database/
│   │   │   ├── init.js
│   │   │   └── schema.sql
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js
│   │   │   └── error.middleware.js
│   │   ├── models/
│   │   │   ├── Booking.model.js
│   │   │   ├── Room.model.js
│   │   │   └── User.model.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── booking.routes.js
│   │   │   ├── dashboard.routes.js
│   │   │   ├── index.js
│   │   │   ├── room.routes.js
│   │   │   └── user.routes.js
│   │   ├── sockets/
│   │   │   └── index.js
│   │   ├── utils/
│   │   │   ├── ApiError.js
│   │   │   ├── asyncHandler.js
│   │   │   ├── token.js
│   │   │   └── validate.js
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
├── docs/
│   └── database-schema.sql
└── README.md
```

---

## 6. Setup and run

### Prerequisites
- Node.js 18 or newer
- MySQL 8 (or MariaDB 10.5+) running, and a user that can create databases

### Backend
```bash
cd ServerUi
npm install
# open .env and set DB_PASSWORD and JWT_SECRET
npm run db:init     # creates DB + tables + admin account + default hotel + 6 sample rooms (safe to re-run)
npm run dev         # nodemon, http://localhost:5000      (npm start for production)
```
Health check: `GET http://localhost:5000/api/health`

### Frontend
```bash
cd ClientUi
npm install
npm run dev         # http://localhost:5178 and http://<this-PC-IP>:5178 (API + sockets proxied to :5000)
```

### Accounts
| Role | Email | Password |
|---|---|---|
| Admin | value of `ADMIN_EMAIL` (default `admin@hotel.com`) | value of `ADMIN_PASSWORD` (default `Admin@123`) |
| Guest | register on the website | — |

Change the admin credentials in `ServerUi/.env` **before** running `npm run db:init`.

---

## 7. Environment variables

### ServerUi/.env
| Variable | Default | Purpose |
|---|---|---|
| `PORT` | 5000 | API port |
| `NODE_ENV` | development | `production` hides error details |
| `CLIENT_URLS` (note) | | In development, local-network origins (localhost, 127.0.0.1, 192.168.x.x, 10.x.x.x, 172.16-31.x.x) are also accepted so the site can be opened by IP address; production accepts only the listed URLs |
| `CLIENT_URLS` | http://localhost:5178 | Comma separated allowed origins (CORS + Socket.io) |
| `DB_HOST` `DB_PORT` `DB_USER` `DB_PASSWORD` `DB_NAME` | localhost / 3306 / root / – / hotel_booking | MySQL connection |
| `JWT_SECRET` | – | **Set a long random string** |
| `JWT_EXPIRES_IN` | 7d | Token lifetime |
| `ADMIN_EMAIL` `ADMIN_PASSWORD` | admin@hotel.com / Admin@123 | Seeded admin |

### ClientUi/.env
| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | http://localhost:5000/api | REST base URL |
| `VITE_SOCKET_URL` | http://localhost:5000 | Socket.io server |
| `VITE_CURRENCY` | USD | ISO currency code used for prices (e.g. `INR`) |

---

## 8. Database design (MySQL)

SQL file: `docs/database-schema.sql` (also used by `npm run db:init`).

```
users (1) ────< bookings >──── (1) rooms >──── (1) hotels
```

**users** — `id, name, email (unique), phone, password_hash, role ENUM(guest, admin), is_active, created_at, updated_at`

**hotels** — `id, name, city, address, phone, star_rating (1-5), description, image_url, is_active, created_at, updated_at`

**employees** — `id, hotel_id → hotels, name, designation, email, phone, salary, joined_on, is_active, created_at, updated_at`

**feedback** — `id, user_id → users, hotel_id → hotels (nullable), rating 1-5, comment, status ENUM(new, reviewed), created_at, updated_at`

**enquiries** — `id, name, email, phone, hotel_id → hotels (nullable), subject, message, status ENUM(new, in_progress, closed), created_at, updated_at`

**payments** — `id, reference (unique), user_id → users, amount, method (card / upi / netbanking), status ENUM(success, failed), failure_reason, booking_ids, card_last4, created_at` (failed attempts are kept for the record)

**password_resets** — `id, user_id → users, token_hash (SHA-256 of the emailed token), expires_at, used_at, created_at`

**rooms** — `id, hotel_id → hotels, name, type ENUM(standard, deluxe, suite, family), description, price_per_night, capacity, is_ac (1 = AC, 0 = Non-AC), size_sqft, amenities JSON, image_url, is_active, created_at, updated_at`

**bookings** — `id, reference (unique), user_id → users, room_id → rooms, check_in, check_out, guests, total_price, status ENUM(pending, confirmed, checked_in, checked_out, cancelled), notes, payment_status ENUM(unpaid, paid), payment_method, paid_at, payment_ref, created_at, updated_at`
Indexes: `(room_id, check_in, check_out)` for overlap queries, `status`.

Availability rule (a room is unavailable when an active booking overlaps):
```sql
b.status IN ('pending','confirmed','checked_in') AND b.check_in < :checkOut AND b.check_out > :checkIn
```

---

## 9. Backend — ServerUi (Node.js, ES modules, MVC)

`package.json` has `"type": "module"`, so every file uses `import` / `export` and `async/await`.

### MVC mapping
| Layer | Folder | Responsibility |
|---|---|---|
| Model | `src/models` | All SQL for one entity (`User.model.js`, `Room.model.js`, `Booking.model.js`) |
| Controller | `src/controllers` | Validate input, call models, emit socket events, shape the response |
| Routes | `src/routes` | URL → controller, with `authenticate` / `authorize('admin')` |
| Middleware | `src/middlewares` | JWT auth, role guard, 404 and central error handler |
| Sockets | `src/sockets` | Socket.io server, JWT handshake, rooms (`admins`, `user:{id}`), emit helpers |
| Config / Utils | `src/config`, `src/utils` | env, MySQL pool, `ApiError`, `asyncHandler`, token + validation helpers |

Request lifecycle: `route → authenticate → authorize → controller (asyncHandler) → model → MySQL → JSON`; any thrown `ApiError` is formatted by `error.middleware.js`.

Response shape: `{ "success": true, "data": … }` or `{ "success": false, "message": "…", "details": { field: "…" } }`.

### REST API (base `/api`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/health` | public | Health check |
| POST | `/auth/register` | public | Create guest account → `{ token, user }` |
| POST | `/auth/login` | public | Guest or admin login |
| POST | `/auth/admin/login` | public | Admin only login |
| GET | `/auth/me` | any signed in | Current user |
| PUT | `/auth/profile` | signed in | `name`, `phone` |
| POST | `/auth/forgot-password` | public | `email`; same answer whether or not the account exists |
| POST | `/auth/reset-password` | public | `token`, `password` (min 8); token works once |
| POST | `/bookings/checkout` | signed in | `{ items: [{ room_id, check_in, check_out, guests }], notes }`, up to 10 rooms, all-or-nothing |
| POST | `/payments` | signed in | `{ booking_ids, method, card_last4 | upi_id | bank }` → payment with `status` success / failed |
| GET | `/payments/:reference` | owner | Payment with its bookings (success / failure pages) |
| GET | `/invoices/mine/:bookingId` | owner | Guest invoice for a non-cancelled booking |
| PUT | `/auth/change-password` | signed in | `current_password`, `new_password` (min 8) |
| GET | `/employees` | admin | Query: `hotelId, designation, search` |
| POST / PUT / DELETE | `/employees`, `/employees/:id` | admin | Create (`hotel_id, name, designation` required), update (incl. `is_active`), delete |
| GET | `/invoices` | admin | Non-cancelled bookings as invoices. Query: `paymentStatus, hotelId, search` |
| GET | `/invoices/:bookingId` | admin | Invoice with `invoice_number, nights, subtotal, tax_rate, tax_amount, grand_total` |
| PATCH | `/invoices/:bookingId/payment` | admin | `{ payment_status: paid, payment_method: cash / card / upi / bank_transfer }` or `{ payment_status: unpaid }` |
| POST | `/feedback` | signed in | `rating` 1-5, `comment`, optional `hotel_id`; emits `feedback:new` to admins |
| GET / PATCH / DELETE | `/feedback`, `/feedback/:id/status`, `/feedback/:id` | admin | List (query `status, hotelId, rating`), set `new` / `reviewed`, delete |
| POST | `/enquiries` | public | `name, email, subject, message`, optional `phone, hotel_id`; emits `enquiry:new` to admins |
| GET / PATCH / DELETE | `/enquiries`, `/enquiries/:id/status`, `/enquiries/:id` | admin | List (query `status, search`), set status, delete |
| GET | `/hotels` | public | List active hotels with `rooms_count`, `ac_rooms_count`, `non_ac_rooms_count`. Query: `search` |
| GET | `/hotels/:id` | public | Hotel details |
| GET | `/hotels/admin/all` | admin | All hotels including hidden |
| POST | `/hotels` | admin | Create hotel (`name`, `city` required) |
| PUT | `/hotels/:id` | admin | Update hotel (incl. `is_active`) |
| DELETE | `/hotels/:id` | admin | Hide hotel and its rooms (soft delete) |
| GET | `/rooms` | public | List active rooms (with `hotel_name`, `hotel_city`, `is_ac`). Query: `hotelId, ac (ac / non_ac), type, minPrice, maxPrice, guests, search, checkIn, checkOut` |
| GET | `/rooms/:id` | public | Room details |
| GET | `/rooms/admin/all` | admin | All rooms including hidden |
| POST | `/rooms` | admin | Create room (`hotel_id` required, `is_ac` defaults to true) |
| PUT | `/rooms/:id` | admin | Update room (incl. `is_active`) |
| DELETE | `/rooms/:id` | admin | Hide room (soft delete) |
| POST | `/bookings` | guest/admin | Create booking `{ room_id, check_in, check_out, guests, notes? }` |
| GET | `/bookings/mine` | signed in | My bookings |
| PATCH | `/bookings/:id/cancel` | owner | Cancel my booking |
| GET | `/bookings` | admin | All bookings. Query: `status, search` |
| PATCH | `/bookings/:id/status` | admin | `{ status }` following the allowed flow |
| GET | `/users` | admin | List users. Query: `search, role` |
| PATCH | `/users/:id/toggle-active` | admin | Enable / disable a guest |
| GET | `/dashboard` | admin | Totals, revenue, occupancy, monthly series, recent bookings |

Auth header: `Authorization: Bearer <token>`.

### Socket.io events

Connect with `io(SOCKET_URL, { auth: { token } })`. The token is optional (anonymous clients still get public events).

| Event | Direction | Sent to | Payload | Trigger |
|---|---|---|---|---|
| `booking:new` | server → client | all admins | booking | Guest creates a booking |
| `booking:updated` | server → client | owning guest + all admins | booking | Status change or cancel |
| `room:changed` | server → client | everyone | `{ action, room \| id }` | Admin creates / edits / hides a room |
| `presence:update` | server → client | all admins | `{ online }` | Any client connects / disconnects |

---

## 10. Frontend — ClientUi

### Separation of Website and Admin
```
src/
├── website/     routes · layouts · components · pages · store · services · hooks   (guest site)
├── admin/       routes · layouts · components · pages · store · services · hooks   (admin console)
├── components/ui/   shared: Modal, PageLoader, Spinner, StatusBadge, EmptyState, ErrorBoundary, PageTransition
├── core/            shared: axios factory, socket factory, formatters, storage helpers
└── store/index.js   combines both sets of slices into one Redux store
```
Website code never imports from `admin/` and vice versa; they only share `core/` and `components/ui/`.

### Lazy loading (separate for admin and website)
1. **Area level** — `App.jsx` lazily loads `WebsiteRoutes` and `AdminRoutes`, so a guest never downloads admin code.
2. **Page level** — `website/routes/lazyPages.js` and `admin/routes/lazyPages.js` each export every page as `lazy(() => import(...))`, wrapped in `<Suspense>` with an animated loader.
3. **Vendor chunks** — `vite.config.js` splits `react`, `redux` and `framer-motion` into cached chunks.

### Redux store (thunk format)

All slices use `createAsyncThunk` (redux-thunk is built into `configureStore`). Pattern:
```js
export const fetchRooms = createAsyncThunk('webRooms/fetchAll', async (filters, { rejectWithValue }) => {
  try { const { data } = await webApi.get('/rooms', { params: filters }); return data.data; }
  catch (err) { return rejectWithValue(getErrorMessage(err)); }
});
// slice.extraReducers: pending → loading, fulfilled → data, rejected → error
```
A plain function thunk is also included (`refreshRooms = () => (dispatch, getState) => …`).

| Store key | File | Thunks | Live reducers |
|---|---|---|---|
| `webAuth` | website/store/authSlice.js | `loginUser`, `registerUser` | – |
| `webCart` | website/store/cartSlice.js | `checkoutCart` | `cartItemAdded`, `cartItemRemoved`, `cartCleared` (persisted to localStorage) |
| `webRooms` | website/store/roomSlice.js | `fetchRooms`, `fetchRoomById`, `checkRoomAvailability`, `refreshRooms` | – |
| `webBookings` | website/store/bookingSlice.js | `createBooking`, `fetchMyBookings`, `cancelBooking` | `bookingUpdatedLive` |
| `adminAuth` | admin/store/adminAuthSlice.js | `adminLogin` | – |
| `adminEmployees` | admin/store/adminEmployeeSlice.js | `fetchEmployees`, `saveEmployee`, `deleteEmployee` | – |
| `adminInvoices` | admin/store/adminInvoiceSlice.js | `fetchInvoices`, `fetchInvoice`, `updatePayment` | – |
| `adminFeedback` | admin/store/adminFeedbackSlice.js | `fetchFeedback`, `setFeedbackStatus`, `deleteFeedback` | `feedbackAddedLive` |
| `adminEnquiries` | admin/store/adminEnquirySlice.js | `fetchEnquiries`, `setEnquiryStatus`, `deleteEnquiry` | `enquiryAddedLive` |
| `adminHotels` | admin/store/adminHotelSlice.js | `fetchAdminHotels`, `saveHotel`, `archiveHotel` | – |
| `adminRooms` | admin/store/adminRoomSlice.js | `fetchAdminRooms`, `saveRoom`, `archiveRoom` | – |
| `adminBookings` | admin/store/adminBookingSlice.js | `fetchAdminBookings`, `changeBookingStatus` | `bookingAddedLive`, `bookingUpdatedLive` |
| `adminUsers` | admin/store/adminUserSlice.js | `fetchUsers`, `toggleUserActive` | – |
| `dashboard` | admin/store/dashboardSlice.js | `fetchDashboard` | `presenceUpdated`, `socketStatusChanged` |

### Design and animation system
- **Palette:** Ocean `#0B2A3B`, Lagoon `#1F7A8C`, Brass `#C8A44D`, Mist `#EEF3F5`, Ink `#13222C`, plus Moss (success) and Coral (danger). Tokens live in `tailwind.config.js`.
- **Type:** Fraunces (display headings) + Manrope (interface text).
- **Modal animation (`components/ui/Modal.jsx`):** blurred backdrop; the panel springs up from depth with a 3D tilt (`rotateX`) and scale; brass/ocean gradient top edge; Esc and backdrop close; scroll lock; focus moves into the dialog; on phones it behaves like a bottom sheet.
- **Hero:** one orchestrated staggered entrance, rolling harbour waves (two SVG layers, CSS `wave` keyframes), a floating price card.
- **Page transitions:** blur-fade between routes (`PageTransition`), shared-layout active-link underline / sidebar marker (`layoutId`).
- **Data motion:** staggered room cards, growing revenue bars, shimmer skeletons, pulsing "live" dots, equalizer-bar page loader.
- **Accessibility:** `MotionConfig reducedMotion="user"` + a CSS reduced-motion rule, visible focus rings, labelled controls, `role="dialog"/"status"/"alert"`.

---

## 11. Realtime flows

**New booking → admin**
1. Guest confirms the booking → `POST /bookings` (transaction + row lock)
2. `booking.controller` emits `booking:new` to the `admins` socket room
3. `useAdminSocket` dispatches `bookingAddedLive`, refreshes the dashboard and shows a toast

**Admin action → guest**
1. Admin clicks *Confirm* → `PATCH /bookings/:id/status`
2. Server emits `booking:updated` to `user:{guestId}` and `admins`
3. `useWebsiteSocket` dispatches `bookingUpdatedLive`; *My bookings* changes status without a refresh

**Room change → everyone**
Admin edits a room → `room:changed` → website runs `refreshRooms()` so prices and visibility stay current.

---

## 12. Security
- Passwords hashed with bcrypt (10 rounds); JWT signed with `JWT_SECRET`
- Role guard on every admin route; admin login endpoint rejects guest accounts; socket rooms are assigned from the verified token only
- Parameterised SQL everywhere (no string-built values)
- `helmet`, CORS restricted to `CLIENT_URLS`, 1 MB JSON body limit
- Disabled accounts are blocked on every request
- Before production: use a strong `JWT_SECRET`, HTTPS, change the seeded admin password, and add rate limiting (e.g. `express-rate-limit`) on `/auth/*`

---

## 13. Build and deployment

```bash
# Frontend
cd ClientUi && npm run build          # outputs dist/ (static files)
# Serve dist/ with any static host; add an SPA fallback so /admin and /rooms/1 load index.html

# Backend
cd ServerUi && NODE_ENV=production npm start   # run behind a process manager (pm2) and a reverse proxy
```
Set `VITE_API_URL` / `VITE_SOCKET_URL` before building the client, and add the client's public URL to `CLIENT_URLS` on the server. If you proxy through nginx, enable WebSocket upgrade headers for Socket.io.

---

## 14. Testing performed on this code
Run against a real MariaDB instance:
- `npm run db:init` creates schema, admin and 6 rooms
- Register / login / admin-only login (guest rejected)
- Booking creation, **double-booking rejected**, availability filter hides booked room
- Status flow (valid and invalid transitions), guest cancel, past-date rejection
- Room create / validate / update / hide, admin-vs-public room lists
- Role protection (guest blocked from admin routes), 401 without token, 404 handler
- Socket.io: admin received `booking:new`, guest received `booking:updated`, anonymous received `room:changed`, guests did **not** receive admin-only events
- `vite build` succeeds with every page emitted as a separate lazy chunk

The UI was verified by production build and API/socket integration tests; it was not clicked through in a browser in the authoring environment, so give it a quick visual pass on first run.

---

## 15. Troubleshooting
| Problem | Fix |
|---|---|
| `MySQL connection failed` | Check `DB_*` in `ServerUi/.env`; MySQL must be running |
| `ER_NOT_SUPPORTED_AUTH_MODE` (MySQL 8 old clients) | `ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'pw';` |
| CORS error in browser | Add the client origin to `CLIENT_URLS` |
| Socket shows "Reconnecting…" in admin | Server not running, or `VITE_SOCKET_URL` is wrong |
| Admin login says "cannot sign in here" | That account is a guest; use the seeded admin |
| Blank page after deploy on refresh | Add an SPA fallback to `index.html` on the host |

---

## 16. Extending the project
- **Payments:** add a `payments` table + model + controller; create a Stripe/Razorpay intent when a booking is created
- **Images:** add `multer` upload route and store files on disk/S3 instead of image URLs
- **Email / SMS:** call a mailer from `booking.controller` next to the socket emits
- **New entity (MVC recipe):** `models/X.model.js` → `controllers/x.controller.js` → `routes/x.routes.js` → register in `routes/index.js`; on the client add `store/xSlice.js` with thunks, a lazy page, and register the reducer in `store/index.js`
