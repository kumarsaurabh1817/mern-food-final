# 🍊 OrangeBite — Complete Project Context

> A full-stack MERN food delivery platform with **four distinct roles**: Customer, Restaurant Owner, Delivery Boy, and Admin.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Application Roles](#3-application-roles)
4. [Order Lifecycle](#4-order-lifecycle)
5. [Authentication & Security Architecture](#5-authentication--security-architecture)
6. [Backend — Full Folder Structure](#6-backend--full-folder-structure)
7. [Frontend — Full Folder Structure](#7-frontend--full-folder-structure)
8. [Backend File Reference (per Role)](#8-backend-file-reference-per-role)
9. [Frontend File Reference (per Role)](#9-frontend-file-reference-per-role)
10. [API Route Map](#10-api-route-map)
11. [Database Models](#11-database-models)
12. [Environment Variables](#12-environment-variables)
13. [Running the Project](#13-running-the-project)

---

## 1. Project Overview

**OrangeBite** is a production-grade food delivery web application built with the MERN stack. It supports a multi-role architecture where:

- **Customers** browse restaurants, add items to cart, place orders (COD or Razorpay online), and track delivery in real-time on a map.
- **Restaurant Owners** manage their shop listing, operating hours, full menu (add/edit/delete/stock-toggle items), and monitor incoming orders through status-driven workflows.
- **Delivery Agents** toggle duty status, view the pool of orders ready for pickup, accept/reject/release assignments, and broadcast their live GPS coordinates via Socket.io.
- **Admins** govern the entire platform: approve/reject KYC for owners & delivery agents, approve/suspend shops, block/unblock users, and view platform-level KPI dashboards and revenue analytics.

**Key Technical Highlights:**
- JWT Access + Refresh token auth with silent auto-refresh (15 min / 7 day tokens)
- Real-time order tracking via **Socket.io** WebSocket rooms
- Razorpay payment gateway (create order intent + HMAC webhook verification)
- Delivery OTP verification to confirm order completion
- Geospatial queries (`2dsphere` indexes) for shop proximity and delivery radius enforcement
- Automated CRON jobs: auto-open/close shops by operating hours, auto-cancel stale orders, prune stale delivery rejections
- Swagger / OpenAPI 3.0 documentation at `/docs`
- Rate limiting on auth endpoints, Helmet.js security headers, CORS whitelist

---

## 2. Tech Stack

### Backend
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js (ESM) | Server runtime |
| Framework | Express.js v5 | HTTP routing & middleware |
| Database | MongoDB + Mongoose v9 | Data persistence |
| Auth | JWT (jsonwebtoken) | Access & refresh tokens |
| Password Hashing | bcrypt | Secure password storage |
| Real-time | Socket.io v4 | Live order & location updates |
| Payments | Razorpay SDK | Online payment processing |
| Email | Nodemailer (Gmail SMTP) | Transactional emails |
| Scheduling | node-cron | Automated background tasks |
| Validation | express-validator | Request body schemas |
| Rate Limiting | express-rate-limit | Auth endpoint protection |
| Security | Helmet.js | HTTP security headers |
| Logging | Morgan | HTTP request logging |
| API Docs | swagger-jsdoc + swagger-ui-express | Interactive API docs |
| Dev Tooling | Nodemon | Auto-restart on change |

### Frontend
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React 19 + Vite 8 | UI framework & build tool |
| Routing | React Router DOM v7 | Client-side routing |
| State Management | Redux Toolkit + React-Redux | Global state (auth, cart, UI) |
| HTTP Client | Axios | API calls with auto-refresh interceptor |
| Real-time | socket.io-client | WebSocket for live tracking |
| Maps | Leaflet + React-Leaflet | Interactive delivery map |
| Payments | Razorpay Checkout SDK | Payment modal |
| Icons | Lucide-React | Icon library |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| Language | JSX (React) | Component syntax |

---

## 3. Application Roles

| Role ID | Display Name | Description |
|---------|-------------|-------------|
| `user` | Customer | Browse restaurants, cart, orders, real-time tracking |
| `owner` | Restaurant Owner | Manage shop, menu items, incoming orders |
| `delivery_boy` | Delivery Agent | Accept/reject orders, broadcast location, OTP verify |
| `admin` | Platform Admin | KYC approvals, shop governance, platform analytics |

**Role access control** is enforced at two layers:
1. **Backend**: `requireRole(...roles)` middleware on every protected route
2. **Frontend**: `ProtectedRoute` component redirects wrong-role users to their own home

---

## 4. Order Lifecycle

```
Customer Places Order (checkout)
        │
        ▼
   [pending] ──► Cron auto-cancels after 30 min if online + unpaid
        │
        │  (online payment) → Razorpay → webhook → paymentStatus = 'paid'
        │  (COD)            → stays pending until owner confirms
        │
   Owner Confirms
        │
        ▼
   [confirmed]
        │
   Owner Marks Preparing
        │
        ▼
   [preparing]
        │
   Owner Marks Ready for Pickup
        │
        ▼
   [ready_for_pickup] ──► appears in Delivery Pool
        │
   Delivery Agent Accepts
        │
        ▼
   [out_for_delivery] ──► Agent broadcasts GPS → Customer sees map
        │
   Delivery Agent verifies OTP from Customer
        │
        ▼
   [delivered] ──► statusTimestamps.delivered recorded
```

Order status transitions are stored with timestamps in `statusTimestamps` subdocument.

---

## 5. Authentication & Security Architecture

### Token Flow
- **Signup/Login** → server returns `accessToken` (15m) + sets HttpOnly `refreshToken` cookie (7d)
- Frontend stores `accessToken` in `localStorage` under key `ob_access_token`
- Every API request attaches `Authorization: Bearer <accessToken>`
- On **401 response** → Axios interceptor calls `/auth/refresh` → gets new `accessToken` → retries original request
- If refresh fails → clear token → redirect to `/login`

### Security Features
- Passwords hashed with bcrypt (12 rounds)
- Email verification required for `owner` and `delivery_boy` roles before login
- Admin approval required for `owner` and `delivery_boy` after email verification
- Failed login attempt tracking with account lock (configurable)
- Rate limiting: 10 login attempts / 15 min; 5 signups / hour; 5 password resets / hour
- Razorpay webhooks verified with HMAC-SHA256 signature on raw request body

---

## 6. Backend — Full Folder Structure

```
Backend/
├── server.js                          # Entry point: DB connect, HTTP server, Socket.io init, graceful shutdown
├── package.json                       # Dependencies & npm scripts
├── .env                               # Local environment variables (not committed)
├── .env.example                       # Template for environment setup
└── src/
    ├── app.js                         # Express app: middleware, route mounting, error handlers
    ├── config/
    │   └── swagger.js                 # OpenAPI 3.0 spec config (swagger-jsdoc)
    ├── controllers/
    │   ├── auth.controller.js         # Signup, login, logout, refresh, verify email, forgot/reset password
    │   ├── user.controller.js         # Profile CRUD, address management, change password
    │   ├── shop.controller.js         # Shop CRUD, menu CRUD, toggle open/stock
    │   ├── order.controller.js        # Checkout, order status transitions, OTP verify, analytics
    │   ├── delivery.controller.js     # Delivery profile, duty toggle, pool, accept/reject/release, earnings
    │   ├── admin.controller.js        # KYC approve/reject, block users, shop approve/suspend, KPIs, revenue
    │   └── payment.controller.js      # Razorpay intent creation, payment verify, webhook handler
    ├── middleware/
    │   ├── auth.middleware.js         # verifyToken (JWT) + requireRole(...roles) guards
    │   ├── rateLimit.middleware.js    # express-rate-limit for login, signup, forgot-password
    │   ├── schemas.middleware.js      # express-validator schemas: signupSchema, loginSchema, checkoutSchema, etc.
    │   └── validate.middleware.js     # validateRequest: collects validation errors and returns 400
    ├── models/
    │   ├── User.js                    # User schema: roles, password hash, KYC, addresses, token fields
    │   ├── Shop.js                    # Shop schema: owner ref, address (2dsphere), menu ref, operating hours
    │   ├── MenuItem.js                # Menu item schema: shop ref, price, isVeg, isAvailable, soft-delete
    │   ├── Order.js                   # Order schema: items, status enum, payment info, deliveryOTP, timestamps
    │   └── DeliveryProfile.js        # Delivery agent profile: isOnline, GPS coordinates (2dsphere), rejectedOrders
    ├── routes/
    │   ├── auth.routes.js             # /auth — signup, login, logout, refresh, verify-email, forgot/reset password
    │   ├── user.routes.js             # /users — profile, addresses, change password
    │   ├── shop.routes.js             # /shops — browse (public), owner CRUD, menu CRUD
    │   ├── order.routes.js            # /orders — checkout, list, detail, status patches, OTP verify
    │   ├── delivery.routes.js         # /delivery — profile, duty, pool, accept/reject/release, earnings
    │   ├── admin.routes.js            # /admin — KPIs, users CRUD, shops manage, revenue analytics
    │   ├── payment.routes.js          # /payments — create intent, verify payment
    │   └── webhook.routes.js          # /webhooks — Razorpay webhook receiver (raw body HMAC verified)
    ├── socket/
    │   └── index.js                   # Socket.io server: auth middleware, room joins, location broadcast
    ├── utils/
    │   ├── token.utils.js             # generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken
    │   ├── email.utils.js             # sendEmail (Nodemailer Gmail), generateRandomToken (crypto)
    │   └── cron.js                    # 3 CRON jobs: shop auto-open/close, stale order cancel, prune rejections
    ├── services/                      # (reserved for future service-layer abstractions)
    └── jobs/                          # (reserved for future job queue integrations)
```

---

## 7. Frontend — Full Folder Structure

```
Frontend/
├── index.html                         # Vite HTML entry point, loads root <div id="root">
├── vite.config.js                     # Vite config: React plugin, basicSsl (HTTPS dev)
├── tailwind.config.js                 # Tailwind CSS v4 configuration and custom tokens
├── eslint.config.js                   # ESLint: react-hooks, react-refresh plugins
├── package.json                       # Dependencies & dev scripts
├── .env                               # VITE_API_URL etc.
├── .env.example                       # Environment template
├── public/                            # Static assets (favicon, robots.txt)
└── src/
    ├── main.jsx                       # React app bootstrap: Provider (Redux), renders <App />
    ├── App.jsx                        # Root router: ProtectedRoute, GuestRoute, role-based layout nesting
    ├── index.css                      # Global CSS: Tailwind base, design tokens, animations, resets
    │
    ├── app/
    │   └── store.js                   # Redux store: auth + cart + ui slices; serializable check config
    │
    ├── features/
    │   ├── auth/
    │   │   └── authSlice.js           # Auth state: signIn, signUp, signOut, loadSession thunks + selectors
    │   ├── cart/
    │   │   └── cartSlice.js           # Cart state: items, shopId; addItem, removeItem, clearCart; addItemSafe thunk
    │   └── ui/
    │       └── uiSlice.js             # UI state: toast notification, clearCartModal; show/hide reducers
    │
    ├── lib/
    │   └── axios.js                   # Axios instance: baseURL, credentials, 401 auto-refresh interceptor
    │
    ├── hooks/
    │   └── useRazorpay.js             # Custom hook: dynamic Razorpay SDK load + openRazorpay() helper
    │
    ├── components/
    │   ├── auth/
    │   │   ├── AuthLayout.jsx         # Shared auth page wrapper: branding, split-panel background
    │   │   ├── Button.jsx             # Reusable styled button: variants (primary, ghost, danger)
    │   │   └── InputField.jsx         # Labeled input with error state for auth forms
    │   ├── cart/
    │   │   └── ClearCartModal.jsx     # Modal: warns when adding from a different restaurant, offers clear+add
    │   └── ui/
    │       └── Toast.jsx              # Global toast notification: auto-dismiss, success/error/info/warning types
    │
    ├── layouts/
    │   ├── CustomerLayout.jsx         # Customer shell: navbar (search, cart badge, profile), outlet
    │   ├── OwnerLayout.jsx            # Owner shell: sidebar nav (dashboard, shop, menu, orders), outlet
    │   ├── DeliveryLayout.jsx         # Delivery shell: minimal navbar + outlet
    │   ├── AdminLayout.jsx            # Admin shell: sidebar nav (dashboard, users, shops), outlet
    │   └── PublicLayout.jsx           # Minimal passthrough layout for non-authenticated pages
    │
    └── pages/
        ├── NotFoundPage.jsx           # 404 catch-all page with navigation back home
        ├── auth/
        │   ├── LoginPage.jsx          # Email + password login; dispatches signIn; rate-limit awareness
        │   ├── SignupPage.jsx         # Registration: name, email, password, role, phone; dispatches signUp
        │   ├── ForgotPasswordPage.jsx # Email input → POST /auth/forgot-password, shows success message
        │   └── ResetPasswordPage.jsx  # Token from URL → new password form → POST /auth/reset-password/:token
        ├── customer/
        │   ├── HomePage.jsx           # Landing: hero section, featured restaurants, categories, search
        │   ├── AllRestaurantsPage.jsx # Paginated restaurant list with filter/search
        │   ├── RestaurantPage.jsx     # Shop detail: info, menu grouped by category, add-to-cart with cross-shop guard
        │   ├── CartPage.jsx           # Cart review: item list, quantity controls, shop name, go to checkout
        │   ├── CheckoutPage.jsx       # Address selection, payment method (COD/online), order summary, Razorpay trigger
        │   ├── OrdersPage.jsx         # Order history list: status badges, cancel eligible orders
        │   ├── OrderTrackingPage.jsx  # Live order tracking: status timeline + Leaflet map with agent marker
        │   └── ProfilePage.jsx        # Shared profile editor: name, phone, saved addresses (add/edit/delete)
        ├── owner/
        │   ├── OwnerDashboard.jsx     # Analytics: revenue, order counts, top items, revenue chart
        │   ├── ShopSetupPage.jsx      # Create/edit shop: name, description, category, address, hours, images
        │   ├── MenuPage.jsx           # Menu management: add/edit/delete items, toggle availability/stock
        │   └── OwnerOrdersPage.jsx    # Incoming order management: confirm, preparing, ready transitions
        ├── delivery/
        │   └── DeliveryDashboard.jsx  # Delivery hub: duty toggle, order pool, accept/reject, live map, OTP verify, earnings
        └── admin/
            ├── AdminDashboard.jsx     # Platform KPIs: GMV, orders, users, commission, pending approvals, revenue chart
            ├── AdminUsersPage.jsx     # User management: list, filter by role, approve/reject KYC, block/unblock
            └── AdminShopsPage.jsx     # Shop management: list, approve pending, suspend/reinstate
```

---

## 8. Backend File Reference (per Role)

### 🔐 Shared / Auth

| File | Purpose |
|------|---------|
| `server.js` | Bootstraps the app: connects MongoDB, starts HTTP server, initialises Socket.io, wires graceful shutdown for SIGINT/SIGTERM |
| `src/app.js` | Creates the Express app: CORS whitelist, Helmet headers, Morgan logging, raw-body capture for Razorpay webhook, mounts all route prefixes, 404 handler, global error handler |
| `src/config/swagger.js` | Generates OpenAPI 3.0 spec from JSDoc comments across all route files; served at `/docs` |
| `src/middleware/auth.middleware.js` | `verifyToken` — extracts Bearer JWT and sets `req.user = { id, role }`; `requireRole(...roles)` — 403 if role doesn't match |
| `src/middleware/rateLimit.middleware.js` | Three limiters: login (10/15m), signup (5/1h), forgot-password (5/1h); configurable via `RATE_LIMIT_MAX_LOGIN` env |
| `src/middleware/schemas.middleware.js` | express-validator chains: `signupSchema`, `loginSchema`, `forgotPasswordSchema`, `resetPasswordSchema`, `checkoutSchema` |
| `src/middleware/validate.middleware.js` | `validateRequest` — collects `validationResult` errors and responds 400 with structured error list |
| `src/utils/token.utils.js` | `generateAccessToken` (15m, contains `sub` + `role`), `generateRefreshToken` (7d), `verifyAccessToken`, `verifyRefreshToken` |
| `src/utils/email.utils.js` | Lazy-singleton Nodemailer Gmail transporter; `sendEmail({to, subject, text, html})` with console fallback; `generateRandomToken()` using crypto |
| `src/utils/cron.js` | Three scheduled jobs: (1) every 5 min — auto-open/close shops by `operatingHours`; (2) every 10 min — auto-cancel stale pending online orders (>30 min); (3) daily 3AM — prune delivered/cancelled orders from `rejectedOrders` arrays |
| `src/socket/index.js` | Socket.io server setup: JWT auth middleware, `joinOrderRoom`, `joinOwnerRoom` events, `updateLocation` broadcast (500ms throttle), `getIO()` singleton |
| `src/controllers/auth.controller.js` | `signup`, `login` (with account lock), `logout`, `refresh` (rotates token), `verifyEmail`, `forgotPassword`, `resetPassword`, `setupAdmin` (one-time bootstrap) |

---

### 👤 Customer Role (`role: "user"`)

**What customers can do:** Browse restaurants → view menus → add to cart → checkout (COD or online) → track live delivery → manage their profile and saved addresses.

#### Backend (Customer-relevant endpoints)

| File | Relevant Handlers | Description |
|------|------------------|-------------|
| `src/routes/shop.routes.js` | `GET /` `GET /search` `GET /:id` | Public (unauthenticated) shop listing, search, and full menu fetch |
| `src/controllers/shop.controller.js` | `getShops`, `searchShops`, `getShopById` | List approved/open shops with geo-proximity sort; full-text search; return shop + menu items |
| `src/routes/order.routes.js` | `POST /checkout` `GET /` `GET /:id` `PATCH /:id/cancel` | Place order (role=user only), list own orders, get single order, cancel eligible orders |
| `src/controllers/order.controller.js` | `checkout`, `getOrders`, `getOrderById`, `cancelOrder` | Validate items, calculate totals (subtotal + platformFee + deliveryCharge), generate delivery OTP, create order; list/filter own orders; cancel if status allows |
| `src/routes/user.routes.js` | All routes | Profile read/update, address CRUD, change password |
| `src/controllers/user.controller.js` | `getOwnProfile`, `updateOwnProfile`, `getAddresses`, `addAddress`, `removeAddress`, `updateAddress`, `changePassword` | Full user self-service |
| `src/routes/payment.routes.js` | `POST /create-intent` `POST /verify` | Create Razorpay order for a pending app order; verify HMAC signature + mark order paid |
| `src/controllers/payment.controller.js` | `createPaymentIntent`, `verifyPayment` | Calls Razorpay API to create order; verifies `razorpay_signature` HMAC-SHA256; updates `paymentStatus` |
| `src/models/Order.js` | `deliveryOTP` field | Customer-facing OTP (plain text, selected only for customer) to hand to delivery agent |

---

### 🏪 Restaurant Owner Role (`role: "owner"`)

**What owners can do:** Create and manage their shop (one shop per owner) → add/edit/delete/stock-toggle menu items → confirm and progress incoming orders through the kitchen workflow.

#### Backend (Owner-relevant endpoints)

| File | Relevant Handlers | Description |
|------|------------------|-------------|
| `src/routes/shop.routes.js` | `GET /owner/me` `POST /` `PATCH /:id` `DELETE /:id` `PATCH /:id/toggle-open` `POST /:id/menu` `PATCH /:id/menu/:itemId` `DELETE /:id/menu/:itemId` `PATCH /:id/menu/:itemId/toggle-stock` | Full shop and menu management (requires `owner` or `admin` role) |
| `src/controllers/shop.controller.js` | `getMyShop`, `createShop`, `updateShop`, `deleteShop`, `toggleShopOpen`, `addMenuItem`, `updateMenuItem`, `deleteMenuItem`, `toggleItemStock` | Shop CRUD; menu item CRUD with soft-delete (`isDeleted`); toggle shop open/closed; toggle item stock availability |
| `src/routes/order.routes.js` | `GET /analytics` `PATCH /:id/confirm` `PATCH /:id/preparing` `PATCH /:id/ready` | Analytics for own shop; advance order through confirmed → preparing → ready_for_pickup |
| `src/controllers/order.controller.js` | `getOrderAnalytics`, `confirmOrder`, `markPreparing`, `markReady` | Aggregated order analytics (total, revenue, breakdown by status); strict status gate validations; fires Socket.io events on each transition |
| `src/models/Shop.js` | `operatingHours`, `commissionRate`, `isOpen`, `isApproved` | Owner controls hours and open status; admin sets commission; shop must be admin-approved before appearing publicly |

---

### 🚴 Delivery Agent Role (`role: "delivery_boy"`)

**What agents can do:** Toggle on/off duty → view the pool of orders ready for pickup → accept or reject individual orders → broadcast live GPS coordinates via Socket.io → verify delivery OTP → view earnings summary.

#### Backend (Delivery-relevant endpoints)

| File | Relevant Handlers | Description |
|------|------------------|-------------|
| `src/routes/delivery.routes.js` | All routes | All delivery endpoints require `delivery_boy` or `admin` role |
| `src/controllers/delivery.controller.js` | `getMyProfile`, `toggleDuty`, `getPool`, `acceptOrder`, `rejectOrder`, `releaseOrder`, `getEarnings` | Profile with `isOnline` status; toggle duty; pool = `ready_for_pickup` orders not in agent's rejected list; accept assigns agent + moves to `out_for_delivery`; reject adds to `rejectedOrders`; release un-assigns and reverts status; earnings from `delivered` orders |
| `src/routes/order.routes.js` | `POST /:id/verify-otp` | OTP verification by delivery agent; requires `delivery_boy` or `admin` role |
| `src/controllers/order.controller.js` | `verifyDeliveryOtp` | Selects `deliveryOTPHash`, bcrypt-compares against submitted OTP, marks order `delivered`, fires Socket.io event |
| `src/socket/index.js` | `updateLocation` event | Delivery agent emits `{orderId, lat, lng}` → server broadcasts `agentLocationUpdated` to `order_${orderId}` room; throttled 500ms per socket |
| `src/models/DeliveryProfile.js` | All fields | `isOnline`, GPS `currentLocation` (2dsphere), `rejectedOrders` array for pool filtering |

---

### 👑 Admin Role (`role: "admin"`)

**What admins can do:** View platform KPIs and revenue analytics → list/approve/reject/block users (especially KYC for owners & delivery boys) → approve/suspend shops → manage all orders and override actions.

#### Backend (Admin-relevant endpoints)

| File | Relevant Handlers | Description |
|------|------------------|-------------|
| `src/routes/admin.routes.js` | All routes | All admin routes require `admin` role; covers dashboard, revenue, user management, shop management |
| `src/controllers/admin.controller.js` | `getDashboardKpis`, `getRevenueAnalytics`, `getUsers`, `approveUser`, `rejectUser`, `toggleBlockUser`, `getShops`, `approveShop`, `toggleSuspendShop` | KPI aggregation (GMV, order count, active users, platform commission, pending approvals); per-shop revenue/payout breakdown; paginated user/shop lists with filters; KYC approve/reject with email notification; block/unblock; shop approve/suspend |
| `src/routes/order.routes.js` | Analytics, confirm, preparing, ready, verify-otp | Admin can perform all owner and delivery agent order actions |
| `src/routes/shop.routes.js` | All owner routes | Admin can manage any shop |
| `src/models/User.js` | `isApprovedByAdmin`, `isBlocked`, `kycDocuments` | Admin sets these flags; owners/delivery boys cannot log in until both email-verified and admin-approved |
| `src/routes/auth.routes.js` | `POST /setup-admin` | One-time endpoint that creates the first admin account; self-seals after first use |

---

## 9. Frontend File Reference (per Role)

### 🔧 Shared Infrastructure

| File | Purpose |
|------|---------|
| `src/main.jsx` | Mounts `<App />` inside Redux `<Provider store={store}>` |
| `src/App.jsx` | Defines all routes using React Router v7; wraps role-specific routes in `ProtectedRoute` + Layout; handles `GuestRoute` redirect for authenticated users; hydrates session via `loadSession` on mount |
| `src/app/store.js` | Redux store with `auth`, `cart`, `ui` slices; serializable check ignores Razorpay callbacks |
| `src/lib/axios.js` | Pre-configured Axios instance (`baseURL: VITE_API_URL`, `withCredentials: true`, 15s timeout); request interceptor attaches `Bearer` token; response interceptor handles 401 → silent refresh → retry queue → redirect |
| `src/features/auth/authSlice.js` | Redux slice + thunks for `signIn`, `signUp`, `signOut`, `loadSession`; selectors: `selectUser`, `selectAuthLoading`, `selectAuthError` |
| `src/features/cart/cartSlice.js` | Cart slice: `addItem`, `removeItem`, `clearCart`, `clearShopAndAddItem`; `addItemSafe` thunk triggers `showClearCartModal` for cross-shop adds; selectors: `selectCartItems`, `selectCartCount`, `selectCartTotal`, `selectCartShopId` |
| `src/features/ui/uiSlice.js` | UI slice: `toast` (show/hide with type+message+duration), `clearCartModal` (item payload for cross-shop confirmation) |
| `src/components/ui/Toast.jsx` | Subscribes to `selectToast`; auto-dismisses after `duration` ms; renders success/error/info/warning variants |
| `src/components/cart/ClearCartModal.jsx` | Modal shown when adding from a different restaurant; offers "Keep current" or "Clear & add new" action |
| `src/components/auth/AuthLayout.jsx` | Split-panel wrapper used by all auth pages: left panel has branding/decorative, right panel has the form |
| `src/components/auth/Button.jsx` | Styled button component with primary, ghost, and danger variants; loading state spinner |
| `src/components/auth/InputField.jsx` | Labeled `<input>` with error message display for auth form fields |
| `src/hooks/useRazorpay.js` | Dynamically injects Razorpay checkout SDK `<script>` tag; returns `{ loaded, openRazorpay(options) }` |
| `src/index.css` | Global stylesheet: Tailwind base layer imports, custom CSS variables, font imports, reusable animation classes |
| `src/pages/NotFoundPage.jsx` | 404 catch-all with contextual message and role-appropriate "go home" link |

---

### 👤 Customer Role — Frontend Files

| File | Route | Purpose |
|------|-------|---------|
| `src/layouts/CustomerLayout.jsx` | Wraps all `/` routes | Navigation bar with logo, search input, cart icon with badge (count from `selectCartCount`), profile dropdown, logout; outlet for page content |
| `src/pages/customer/HomePage.jsx` | `/` | Hero banner, featured/popular restaurants grid, category chips filter, search redirect; fetches `GET /shops` |
| `src/pages/customer/AllRestaurantsPage.jsx` | `/restaurants` | Full paginated restaurant listing with filter bar (cuisine, sort); fetches `GET /shops` with query params |
| `src/pages/customer/RestaurantPage.jsx` | `/restaurant/:id` | Full restaurant page: banner, info (hours, rating, delivery charge), menu grouped by category; add/remove cart buttons call `addItemSafe`; fetches `GET /shops/:id` |
| `src/pages/customer/CartPage.jsx` | `/cart` | Cart summary: item list with `+`/`-`/remove controls, shop name, subtotal, "Go to Checkout" CTA |
| `src/pages/customer/CheckoutPage.jsx` | `/checkout` | Address selector (saved addresses + add new), payment method toggle (COD / Online), order summary; for COD calls `POST /orders/checkout`; for Online calls checkout then `POST /payments/create-intent` then `useRazorpay().openRazorpay()` then `POST /payments/verify` |
| `src/pages/customer/OrdersPage.jsx` | `/orders` | Order history list with status badges, date/time, items summary, "Track" and "Cancel" actions |
| `src/pages/customer/OrderTrackingPage.jsx` | `/track/:orderId` | Live order tracking: status timeline (step indicators), Leaflet map showing delivery agent's live location via Socket.io `agentLocationUpdated` event; joins `order_${orderId}` room |
| `src/pages/customer/ProfilePage.jsx` | `/profile` | Shared profile page (also used by owner, delivery, admin): name/phone edit form; saved addresses list with add/edit/delete |

---

### 🏪 Restaurant Owner Role — Frontend Files

| File | Route | Purpose |
|------|-------|---------|
| `src/layouts/OwnerLayout.jsx` | Wraps all `/owner/*` routes | Sidebar navigation: Dashboard, Shop Setup, Menu, Orders, Profile; hamburger for mobile; outlet |
| `src/pages/owner/OwnerDashboard.jsx` | `/owner` | Analytics dashboard: total revenue, total orders, avg order value, top-selling items; bar/line chart (rendered manually or via canvas); fetches `GET /orders/analytics` |
| `src/pages/owner/ShopSetupPage.jsx` | `/owner/shop` | Create/update shop form: name, description, category, address fields, delivery radius, operating hours, image URLs; `GET /shops/owner/me` to prefill; `POST /shops` or `PATCH /shops/:id` |
| `src/pages/owner/MenuPage.jsx` | `/owner/menu` | Menu CRUD: tabbed by category; item cards with edit/delete/stock-toggle; "Add Item" modal; calls `POST /shops/:id/menu`, `PATCH .../:itemId`, `DELETE .../:itemId`, `PATCH .../toggle-stock` |
| `src/pages/owner/OwnerOrdersPage.jsx` | `/owner/orders` | Incoming order list: real-time updates via Socket.io `joinOwnerRoom`; action buttons per order status (Confirm, Mark Preparing, Mark Ready); calls `PATCH /orders/:id/confirm`, `/preparing`, `/ready` |

---

### 🚴 Delivery Agent Role — Frontend Files

| File | Route | Purpose |
|------|-------|---------|
| `src/layouts/DeliveryLayout.jsx` | Wraps all `/delivery/*` routes | Minimal layout: navbar with agent name, duty status badge, profile link; outlet |
| `src/pages/delivery/DeliveryDashboard.jsx` | `/delivery` | All-in-one delivery hub: duty toggle button (`PATCH /delivery/toggle-duty`); order pool list (`GET /delivery/pool`); accept (`POST /delivery/accept/:orderId`) / reject (`POST /delivery/reject/:orderId`) / release buttons; active order card with Leaflet map; GPS broadcasting via `socket.emit('updateLocation', {orderId, lat, lng})`; OTP verify input (`POST /orders/:id/verify-otp`); earnings section (`GET /delivery/earnings`) |

---

### 👑 Admin Role — Frontend Files

| File | Route | Purpose |
|------|-------|---------|
| `src/layouts/AdminLayout.jsx` | Wraps all `/admin/*` routes | Sidebar navigation: Dashboard, Users, Shops, Profile; collapse toggle; outlet |
| `src/pages/admin/AdminDashboard.jsx` | `/admin` | Platform KPI cards: GMV, total orders, active users, pending approvals, commission earned; revenue trend chart; fetches `GET /admin/dashboard` and `GET /admin/revenue` |
| `src/pages/admin/AdminUsersPage.jsx` | `/admin/users` | Paginated user table with role/status filters; actions: Approve KYC (`PATCH /admin/users/:id/approve`), Reject KYC (`PATCH /admin/users/:id/reject`), Block/Unblock (`PATCH /admin/users/:id/block`); fetches `GET /admin/users` |
| `src/pages/admin/AdminShopsPage.jsx` | `/admin/shops` | Paginated shop table with approval filter; actions: Approve shop (`PATCH /admin/shops/:id/approve`), Suspend/Reinstate (`PATCH /admin/shops/:id/suspend`); fetches `GET /admin/shops` |

---

## 10. API Route Map

All backend routes are prefixed at `http://localhost:5000` (no `/api` prefix in Express — the `/api` prefix shown below is what the frontend Axios instance (`VITE_API_URL/api`) resolves to).

### Auth — `/auth`

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `POST` | `/auth/setup-admin` | ❌ | — | One-time admin bootstrap |
| `POST` | `/auth/signup` | ❌ | — | Register new account |
| `POST` | `/auth/login` | ❌ | — | Login, returns accessToken |
| `POST` | `/auth/logout` | ✅ | any | Logout, clears refresh cookie |
| `POST` | `/auth/refresh` | ❌ | — | Refresh access token via cookie |
| `GET`  | `/auth/verify-email/:token` | ❌ | — | Verify email link |
| `POST` | `/auth/forgot-password` | ❌ | — | Send reset email |
| `POST` | `/auth/reset-password/:token` | ❌ | — | Reset password |

### Users — `/users`

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `GET` | `/users/me` | ✅ | any | Get own profile |
| `PATCH` | `/users/me` | ✅ | any | Update own profile |
| `GET` | `/users/me/addresses` | ✅ | any | List saved addresses |
| `POST` | `/users/me/addresses` | ✅ | any | Add new address |
| `PATCH` | `/users/me/addresses/:id` | ✅ | any | Update address |
| `DELETE` | `/users/me/addresses/:id` | ✅ | any | Remove address |
| `POST` | `/users/me/change-password` | ✅ | any | Change password |

### Shops — `/shops`

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `GET` | `/shops` | ❌ | — | List approved open shops |
| `GET` | `/shops/search` | ❌ | — | Search by name/cuisine |
| `GET` | `/shops/:id` | ❌ | — | Get shop + menu |
| `GET` | `/shops/owner/me` | ✅ | owner/admin | Get own shop |
| `POST` | `/shops` | ✅ | owner/admin | Create shop |
| `PATCH` | `/shops/:id` | ✅ | owner/admin | Update shop |
| `DELETE` | `/shops/:id` | ✅ | owner/admin | Delete shop |
| `PATCH` | `/shops/:id/toggle-open` | ✅ | owner/admin | Toggle open status |
| `POST` | `/shops/:id/menu` | ✅ | owner/admin | Add menu item |
| `PATCH` | `/shops/:id/menu/:itemId` | ✅ | owner/admin | Update menu item |
| `DELETE` | `/shops/:id/menu/:itemId` | ✅ | owner/admin | Delete menu item |
| `PATCH` | `/shops/:id/menu/:itemId/toggle-stock` | ✅ | owner/admin | Toggle stock |

### Orders — `/orders`

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `POST` | `/orders/checkout` | ✅ | user | Place new order |
| `GET` | `/orders/analytics` | ✅ | owner/admin | Order analytics |
| `GET` | `/orders` | ✅ | any | List orders |
| `GET` | `/orders/:id` | ✅ | any | Get order detail |
| `PATCH` | `/orders/:id/cancel` | ✅ | any | Cancel order |
| `PATCH` | `/orders/:id/confirm` | ✅ | owner/admin | Confirm order |
| `PATCH` | `/orders/:id/preparing` | ✅ | owner/admin | Mark preparing |
| `PATCH` | `/orders/:id/ready` | ✅ | owner/admin | Mark ready for pickup |
| `POST` | `/orders/:id/verify-otp` | ✅ | delivery_boy/admin | Verify delivery OTP |

### Delivery — `/delivery`

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `GET` | `/delivery/me` | ✅ | delivery_boy/admin | Get delivery profile |
| `PATCH` | `/delivery/toggle-duty` | ✅ | delivery_boy/admin | Toggle on/off duty |
| `GET` | `/delivery/pool` | ✅ | delivery_boy/admin | Get available orders |
| `POST` | `/delivery/accept/:orderId` | ✅ | delivery_boy/admin | Accept order |
| `POST` | `/delivery/reject/:orderId` | ✅ | delivery_boy/admin | Reject order |
| `POST` | `/delivery/release/:orderId` | ✅ | delivery_boy/admin | Release order back to pool |
| `GET` | `/delivery/earnings` | ✅ | delivery_boy/admin | Get earnings summary |

### Admin — `/admin`

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `GET` | `/admin/dashboard` | ✅ | admin | Platform KPIs |
| `GET` | `/admin/revenue` | ✅ | admin | Revenue analytics |
| `GET` | `/admin/users` | ✅ | admin | List all users |
| `PATCH` | `/admin/users/:id/approve` | ✅ | admin | Approve KYC |
| `PATCH` | `/admin/users/:id/reject` | ✅ | admin | Reject KYC |
| `PATCH` | `/admin/users/:id/block` | ✅ | admin | Block/unblock user |
| `GET` | `/admin/shops` | ✅ | admin | List all shops |
| `PATCH` | `/admin/shops/:id/approve` | ✅ | admin | Approve shop |
| `PATCH` | `/admin/shops/:id/suspend` | ✅ | admin | Suspend/reinstate shop |

### Payments — `/payments`

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `POST` | `/payments/create-intent` | ✅ | any | Create Razorpay order |
| `POST` | `/payments/verify` | ✅ | any | Verify Razorpay payment |

### Webhooks — `/webhooks`

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `POST` | `/webhooks/razorpay` | ❌ (HMAC) | — | Razorpay event receiver |

### System

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | API liveness check |
| `GET` | `/v1/health` | Health endpoint |
| `GET` | `/docs` | Swagger UI |
| `GET` | `/api-docs.json` | Raw OpenAPI spec JSON |

---

## 11. Database Models

### User
```
User {
  name: String (required, max 100)
  email: String (required, unique, lowercase)
  password: String (bcrypt hashed, never returned)
  role: enum['user', 'owner', 'delivery_boy', 'admin']
  phone: String (optional, E.164 format)
  profilePicture: String (URL)
  isEmailVerified: Boolean (default: false)
  isApprovedByAdmin: Boolean (default: false)
  isBlocked: Boolean (default: false)
  kycDocuments: { aadhaar, pan, fssai }
  failedLoginAttempts: Number
  accountLockedUntil: Date
  addresses: [AddressSchema]  ← subdocuments with label/street/city/state/zip/lat/lng/isDefault
  refreshTokens: [String]
  emailVerificationToken: String
  emailVerificationExpires: Date (TTL)
  passwordResetToken: String
  passwordResetExpires: Date (TTL)
  timestamps: createdAt, updatedAt
}
```

### Shop
```
Shop {
  owner: ObjectId → User (unique — 1 shop per owner)
  name: String (required)
  description: String (max 500)
  category: String  ← cuisine type
  images: [String]  ← Cloudinary URLs
  address: { street, city, state, zipCode, country, coordinates: GeoJSON Point }
  deliveryRadiusKm: Number (default: 5)
  commissionRate: Number (default: 10%)  ← set by admin
  isOpen: Boolean
  operatingHours: { open: "HH:mm", close: "HH:mm" }
  isApproved: Boolean  ← set by admin
  isSuspended: Boolean  ← set by admin
  timestamps: createdAt, updatedAt
  indexes: 2dsphere on coordinates, text on name/description/category
}
```

### MenuItem
```
MenuItem {
  shop: ObjectId → Shop (required)
  name: String (required)
  description: String (max 300)
  price: Number (required, min 0)
  category: String
  image: String
  isVeg: Boolean (required)
  isAvailable: Boolean (default: true)
  quantity: Number
  isDeleted: Boolean (default: false)  ← soft delete
  timestamps: createdAt, updatedAt
  indexes: shop ref, text on name/description
}
```

### Order
```
Order {
  idempotencyKey: String (unique, sparse)  ← prevents duplicate checkouts
  idempotencyKeyExpiresAt: Date
  customer: ObjectId → User (required)
  shop: ObjectId → Shop (required)
  deliveryAgent: ObjectId → User
  items: [{ menuItem, name, price, quantity }]
  subtotal: Number
  platformFee: Number
  deliveryCharge: Number
  totalAmount: Number
  paymentMethod: enum['online', 'cod']
  paymentStatus: enum['pending', 'paid', 'failed', 'refunded']
  paymentGatewayId: String  ← Razorpay order ID
  status: enum['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled']
  preparationTime: Number
  deliveryAddress: { street, city, state, zipCode, country }
  deliveryOTP: String (select: false)  ← shown to customer only
  deliveryOTPHash: String (select: false)  ← bcrypt hash for verification
  statusTimestamps: { pending, confirmed, preparing, ready_for_pickup, out_for_delivery, delivered, cancelled }
  timestamps: createdAt, updatedAt
  compound indexes: [shop+status], [customer+status], [deliveryAgent+status]
}
```

### DeliveryProfile
```
DeliveryProfile {
  user: ObjectId → User (required, unique)
  isOnline: Boolean (default: false)
  currentLocation: GeoJSON Point { coordinates: [lng, lat] }
  rejectedOrders: [ObjectId → Order]  ← prevents re-offering rejected orders
  timestamps: createdAt, updatedAt
  index: 2dsphere on currentLocation
}
```

---

## 12. Environment Variables

### Backend (`Backend/.env`)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/orangebite

# Auth Tokens
ACCESS_TOKEN_SECRET=<your-long-random-secret>
REFRESH_TOKEN_SECRET=<your-different-long-secret>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Password Hashing
BCRYPT_SALT_ROUNDS=12

# Email (Gmail SMTP)
SMTP_USER=your@gmail.com
SMTP_PASS=your-google-app-password
EMAIL_FROM="OrangeBite <no-reply@orangebite.com>"

# Client URL (CORS)
CLIENT_URL=http://localhost:5173

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=your-razorpay-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# Rate Limiting (optional override for dev)
RATE_LIMIT_MAX_LOGIN=10
```

### Frontend (`Frontend/.env`)

```env
VITE_API_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=rzp_test_xxxx
```

---

## 13. Running the Project

### Prerequisites
- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB)
- Razorpay test account (for payment flows)
- Gmail account with App Password (for email flows)

### Backend

```bash
cd Backend
npm install
# Copy .env.example to .env and fill in values
npm run dev        # starts with nodemon on port 5000
```

### Frontend

```bash
cd Frontend
npm install
# Copy .env.example to .env and fill in VITE_API_URL
npm run dev        # starts Vite dev server on port 5173
```

### First-time Admin Setup

```bash
# After backend is running, call the one-time setup endpoint:
curl -X POST http://localhost:5000/auth/setup-admin \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@orangebite.com","password":"Admin@1234"}'
# This endpoint self-seals after first admin is created
```

### API Documentation

Navigate to **`http://localhost:5000/docs`** for the interactive Swagger UI.

---

## Quick Reference: Role → Routes → Pages

| Role | Login → Redirect | Backend Route Prefix | Frontend Pages |
|------|-----------------|---------------------|----------------|
| `user` (Customer) | `/` | `/shops`, `/orders`, `/users`, `/payments` | `HomePage`, `AllRestaurantsPage`, `RestaurantPage`, `CartPage`, `CheckoutPage`, `OrdersPage`, `OrderTrackingPage`, `ProfilePage` |
| `owner` (Restaurant Owner) | `/owner` | `/shops` (owner), `/orders` (manage) | `OwnerDashboard`, `ShopSetupPage`, `MenuPage`, `OwnerOrdersPage`, `ProfilePage` |
| `delivery_boy` (Delivery Agent) | `/delivery` | `/delivery`, `/orders` (OTP) | `DeliveryDashboard`, `ProfilePage` |
| `admin` (Platform Admin) | `/admin` | `/admin`, `/shops`, `/orders`, `/users` | `AdminDashboard`, `AdminUsersPage`, `AdminShopsPage`, `ProfilePage` |

---

*Generated: June 2026 | Project: OrangeBite MERN Food Delivery Platform*
