# 🍊 OrangeBite — Backend API

> **Node.js · Express · MongoDB · Socket.IO · Razorpay · Nodemailer**
> 
> RESTful API backend for the OrangeBite food delivery platform, powering customer orders, restaurant management, real-time delivery tracking, and secure payments.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Routes](#-api-routes)
- [Authentication & Security](#-authentication--security)
- [Real-Time (Socket.IO)](#-real-time-socketio)
- [Payment Integration](#-payment-integration)
- [Email Service](#-email-service)
- [Scripts](#-scripts)

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express 5 |
| Database | MongoDB + Mongoose 9 |
| Authentication | JWT (HttpOnly Cookies) — Access 15m / Refresh 7d |
| Password Hashing | bcrypt (12 rounds) |
| Real-Time | Socket.IO 4 |
| Payments | Razorpay |
| Email | Nodemailer (Gmail SMTP) |
| Validation | express-validator + Zod schemas |
| Security | Helmet, CORS, express-rate-limit |
| Logging | Morgan |
| Scheduler | node-cron |
| API Docs | Swagger (swagger-jsdoc + swagger-ui-express) |
| Dev Server | Nodemon |

---

## 📁 Project Structure

```
Backend/
├── server.js              # HTTP + Socket.IO server bootstrap
├── src/
│   ├── app.js             # Express app setup (middleware, routes, Swagger)
│   ├── config/            # DB connection, environment config
│   ├── controllers/       # Route handler logic
│   │   ├── auth.controller.js
│   │   ├── order.controller.js
│   │   ├── shop.controller.js
│   │   ├── menu.controller.js
│   │   ├── delivery.controller.js
│   │   ├── payment.controller.js
│   │   └── admin.controller.js
│   ├── models/            # Mongoose schemas
│   │   ├── User.model.js
│   │   ├── Order.model.js
│   │   ├── Shop.model.js
│   │   ├── MenuItem.model.js
│   │   └── DeliveryAgent.model.js
│   ├── routes/            # Express routers
│   ├── middleware/        # Auth guard, validation, rate-limit, error handler
│   ├── services/          # Business logic services
│   ├── utils/             # Helpers (token, email, password reset, etc.)
│   ├── jobs/              # node-cron scheduled tasks
│   └── socket/            # Socket.IO event handlers
└── .env                   # ⚠️ Not committed — see Environment Variables
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- MongoDB Atlas cluster (or local instance)

### Installation

```bash
# From the repo root
cd Backend
npm install
```

### Development

```bash
npm start         # Starts server with nodemon (auto-reload)
```

The API is available at `http://localhost:5000` by default.

---

## 🔑 Environment Variables

Create a `.env` file in the `Backend/` directory. **Never commit this file.**

```env
# ── MongoDB ────────────────────────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/FoodApp

# ── Server ─────────────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# ── JWT ────────────────────────────────────────────────────────────────────────
ACCESS_TOKEN_SECRET=<random_32+_char_secret>
REFRESH_TOKEN_SECRET=<random_32+_char_secret>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12

# ── Razorpay ───────────────────────────────────────────────────────────────────
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=<your_webhook_secret>

# ── SMTP (Gmail App Password) ──────────────────────────────────────────────────
SMTP_USER=your@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx    # 16-char Google App Password
EMAIL_FROM="OrangeBite <your@gmail.com>"
```

> **Gmail App Password setup:** Google Account → Security → 2-Step Verification → App Passwords → Create.

---

## 📡 API Routes

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/auth/register` | Register new user | Public |
| `POST` | `/auth/login` | Login & receive HttpOnly cookies | Public |
| `POST` | `/auth/logout` | Invalidate tokens | Private |
| `POST` | `/auth/refresh` | Refresh access token | Refresh cookie |
| `POST` | `/auth/forgot-password` | Send password reset email | Public |
| `POST` | `/auth/reset-password` | Reset password via token | Public |
| `GET` | `/auth/verify-email/:token` | Verify email address | Public |
| `GET` | `/shops` | List all approved shops | Public |
| `GET` | `/shops/:id` | Get shop details + menu | Public |
| `POST` | `/shops` | Create shop (owner) | Owner |
| `PUT` | `/shops/:id` | Update shop details | Owner |
| `GET` | `/menu/:shopId` | Get menu items | Public |
| `POST` | `/menu` | Add menu item | Owner |
| `PUT` | `/menu/:id` | Update menu item | Owner |
| `DELETE` | `/menu/:id` | Delete menu item | Owner |
| `POST` | `/orders` | Place an order | Customer |
| `GET` | `/orders/my` | Get user's order history | Customer |
| `GET` | `/orders/shop` | Get shop's orders | Owner |
| `PATCH` | `/orders/:id/status` | Update order status | Owner/Delivery |
| `POST` | `/payment/create-order` | Create Razorpay order | Customer |
| `POST` | `/payment/verify` | Verify payment signature | Customer |
| `POST` | `/payment/webhook` | Razorpay webhook handler | Public |
| `GET` | `/delivery/assignments` | Get delivery assignments | Agent |
| `PATCH` | `/delivery/:id/location` | Update agent location | Agent |
| `GET` | `/admin/users` | List all users | Admin |
| `PATCH` | `/admin/shops/:id/approve` | Approve shop | Admin |

> Full interactive docs available at `http://localhost:5000/api-docs` (Swagger UI).

---

## 🔐 Authentication & Security

- **JWT Strategy**: Short-lived Access Token (15 min) + long-lived Refresh Token (7 days), both stored as **HttpOnly, Secure cookies** — not accessible from JavaScript.
- **Token Refresh**: Sliding window via `/auth/refresh`. Refresh token is rotated on each use.
- **Helmet**: Sets secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.).
- **CORS**: Restricted to `CLIENT_URL` origin with credentials support.
- **Rate Limiting**: Global limiter on all `/api` routes; stricter limits on auth endpoints.
- **Password Hashing**: bcrypt with 12 salt rounds.
- **Input Validation**: `express-validator` schemas on all mutation routes.

---

## ⚡ Real-Time (Socket.IO)

Socket.IO is mounted on the same HTTP server as Express.

| Event (Server → Client) | Payload | Description |
|---|---|---|
| `order:new` | `{ order }` | New order placed — emitted to shop room |
| `order:status` | `{ orderId, status }` | Order status update broadcast |
| `delivery:location` | `{ agentId, coords }` | Live agent location update |

Rooms: Shops join `shop:<shopId>`; delivery agents join `agent:<agentId>`; customers join `order:<orderId>`.

---

## 💳 Payment Integration

Razorpay is used for all payment processing:

1. **`POST /payment/create-order`** — Backend creates a Razorpay order and returns `orderId` + `amount`.
2. **Frontend** — Uses Razorpay Checkout SDK; on success triggers `POST /payment/verify`.
3. **`POST /payment/verify`** — Validates HMAC signature using `RAZORPAY_KEY_SECRET`. On success, order is confirmed in the database.
4. **Webhook** — `POST /payment/webhook` handles async events (payment captured, refunded) validated via `RAZORPAY_WEBHOOK_SECRET`.

---

## 📧 Email Service

Nodemailer with Gmail SMTP is used for transactional emails:

- **Email Verification** — Sent on signup; contains a tokenised link.
- **Password Reset** — OTP/token-based link with 15-minute expiry.
- **Order Confirmation** — Summary sent to customer on successful payment.

Template utility located at `src/utils/email.utils.js`.

---

## 📜 Scripts

```bash
npm start       # Start dev server with nodemon
npm test        # (placeholder — add Jest/Supertest here)
```

---

## ⚠️ Security Notice

> **Rotate all secrets before any public deployment.** MongoDB URI, JWT secrets, Razorpay keys, and SMTP credentials must never be committed to version control. Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, or at minimum environment injection from your CI/CD pipeline) in production.
