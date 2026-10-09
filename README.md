# Harbourline Hotel — Booking Website + Admin Console

A full-stack hotel booking system with a **guest website** and a separate **admin console**, sharing one API and live updates over Socket.io.

| Folder | What it is | Stack |
|---|---|---|
| `ClientUi/` | Website (`/`) and Admin (`/admin`) in separate folders | React 18, Vite, Tailwind CSS, Framer Motion, Redux Toolkit (thunk), React Router, Socket.io client |
| `ServerUi/` | REST API + realtime server | Node.js (ES modules, async/await), Express, **MVC**, Socket.io, MySQL (mysql2), JWT |
| `docs/` | Full documentation + SQL schema | Markdown / SQL |

## Quick start

**Requirements:** Node.js 18+ and MySQL 8 (or MariaDB 10.5+) running locally.

```bash
# 1) Backend
cd ServerUi
npm install
#   edit .env  -> set DB_PASSWORD (and JWT_SECRET)
npm run db:init        # creates database, tables, admin user, a default hotel and 6 sample rooms
npm run db:demo        # optional: 12 months of sample guests/bookings so the dashboard charts have data
#                        (remove it again with: npm run db:demo:clear)
npm run dev            # http://localhost:5000

# 2) Frontend (new terminal)
cd ClientUi
npm install
npm run dev            # http://localhost:5178
```

| Area | URL | Login |
|---|---|---|
| Website | http://localhost:5178 | Register a new guest account |
| Admin | http://localhost:5178/admin | `admin@hotel.com` / `Admin@123` (change in `ServerUi/.env` before `db:init`) |

**Open from other devices (phone, another PC) on the same network:** use http://<this-PC-IP>:5178 (find the IP with `ipconfig`, e.g. http://192.168.1.103:5178). The Vite dev server listens on the network and forwards `/api` and `/socket.io` to the backend, so only port 5178 needs to be allowed in Windows Firewall (run once in an Administrator terminal):

```powershell
New-NetFirewallRule -DisplayName "Harbourline dev (5178)" -Direction Inbound -Protocol TCP -LocalPort 5178 -Action Allow -Profile Domain,Private
```

**Guest website:** rooms → cart → checkout → payment (demo gateway, test cards below) → success / failure, plus login, register, forgot / reset password and an account area (dashboard, bookings, invoices, profile, change password, logout).

**Demo payment test cards** (no real money is taken):

| Card number | Result |
|---|---|
| 4242 4242 4242 4242 (Visa) | Success |
| 5555 5555 5555 4444 (Mastercard) | Success |
| 3782 8224 6310 005 (Amex, CVV 1234) | Success |
| 6011 1111 1111 1117 (Discover) | Success |
| 4000 0000 0000 0002 | Declined by bank |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0000 0000 0069 | Expired card |
| 4000 0000 0000 0127 | Incorrect CVV |
| 4000 0000 0000 0119 | Processing error |

Use any future expiry (e.g. 12/27), CVV 123 and any name. UPI: success@upi succeeds, fail@upi fails. Net banking: "Test bank" fails. The payment page lists these with a **Use** button that fills the form.

**Admin sections:** Dashboard · Bookings · Invoices (printable, paid/unpaid) · Hotels · Rooms (AC / Non-AC) · Employees · Users · Feedback · Enquiries · Change password · Logout. Guests send feedback from `/feedback` and enquiries from `/contact` on the website.

**Hotels & rooms:** in the admin, *Hotels* lists every hotel with its AC / Non-AC room counts, and *Rooms* lets you assign each room to a hotel and mark it AC or Non-AC. Existing databases are upgraded automatically when the server starts.

**Try the realtime flow:** open the admin console in one window, book a room as a guest in another. The admin sees a toast and the booking instantly; when admin confirms it, the guest's *My bookings* page updates live.

Full documentation: [`docs/DOCUMENTATION.md`](docs/DOCUMENTATION.md)
