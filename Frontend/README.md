# 🍊 OrangeBite — Frontend

> **React 19 · Vite 8 · Tailwind CSS 4 · Redux Toolkit · React Router 7 · Socket.IO**
>
> Multi-portal React SPA for the OrangeBite food delivery platform — serving customers, restaurant owners, delivery agents, and platform admins from a single codebase.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Portals](#-portals)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [State Management](#-state-management)
- [Real-Time](#-real-time)
- [Maps & Location](#-maps--location)
- [Scripts](#-scripts)

---

## 🛠 Tech Stack

| Category | Technology |
|---|---|
| Framework | React 19 |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS 4 |
| Routing | React Router DOM 7 |
| State Management | Redux Toolkit + React-Redux |
| HTTP Client | Axios (with interceptors) |
| Real-Time | Socket.IO Client 4 |
| Maps | Leaflet + React-Leaflet |
| Icons | Lucide React |
| IDs | UUID |

---

## 📁 Project Structure

```
Frontend/
├── index.html
├── vite.config.js
├── eslint.config.js
└── src/
    ├── main.jsx               # App entry — Redux Provider + Router
    ├── App.jsx                # Root router — portal routing
    ├── index.css              # Global design system (CSS variables, animations)
    ├── app/
    │   └── store.js           # Redux store configuration
    ├── features/              # Redux slices (auth, cart, orders, etc.)
    ├── hooks/                 # Custom React hooks
    ├── lib/
    │   ├── axios.js           # Axios instance with baseURL & interceptors
    │   └── socket.js          # Socket.IO client singleton
    ├── layouts/               # Shared layout wrappers (CustomerLayout, OwnerLayout…)
    ├── components/            # Reusable UI components
    │   ├── ui/                # Primitives: Button, Input, Modal, Badge, etc.
    │   ├── map/               # Leaflet map components
    │   └── shared/            # Cross-portal components
    └── pages/                 # Route-level page components
        ├── auth/              # Login, Register, ForgotPassword, ResetPassword
        ├── customer/          # Home, Restaurants, Menu, Cart, Checkout, Orders
        ├── owner/             # Dashboard, Menu Manager, Order Queue, Shop Setup
        ├── delivery/          # Agent Dashboard, Active Delivery Map
        └── admin/             # User Management, Shop Approvals, Analytics
```

---

## 🖥 Portals

The app is split into four distinct portals, each with its own layout, navigation, and protected routes:

| Portal | Route Prefix | Users |
|---|---|---|
| **Customer** | `/` | Registered customers browsing & ordering food |
| **Owner** | `/owner` | Restaurant owners managing their shop & menu |
| **Delivery** | `/delivery` | Delivery agents tracking & completing deliveries |
| **Admin** | `/admin` | Platform administrators managing the system |

Route access is gated by role-based `ProtectedRoute` components that validate the JWT from the Redux auth slice.

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- OrangeBite Backend running at `http://localhost:5000`

### Installation

```bash
# From the repo root
cd Frontend
npm install
```

### Development

```bash
npm run dev       # Start Vite dev server at http://localhost:5173
```

---

## 🔑 Environment Variables

Create a `.env` file in the `Frontend/` directory. **Never commit this file.**

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

> All Vite env variables must be prefixed with `VITE_` to be exposed to the browser bundle.

---

## 🗃 State Management

Redux Toolkit slices in `src/features/`:

| Slice | State Managed |
|---|---|
| `authSlice` | Current user, role, login/logout actions |
| `cartSlice` | Cart items, quantities, shop context |
| `orderSlice` | Order history, active order status |
| `shopSlice` | Owner's shop data |
| `uiSlice` | Loading states, modal visibility, toast queue |

Axios instance (`src/lib/axios.js`) automatically attaches credentials (HttpOnly cookies are sent with every request via `withCredentials: true`) and handles 401 token refresh.

---

## ⚡ Real-Time

`src/lib/socket.js` exports a singleton Socket.IO client that connects to the backend WebSocket server.

| Event (Client listens) | Action |
|---|---|
| `order:new` | Owner dashboard shows incoming order toast + updates queue |
| `order:status` | Customer's order tracker updates live |
| `delivery:location` | Customer map shows agent's real-time position |

Socket connection is initialised after successful login and torn down on logout.

---

## 🗺 Maps & Location

- **Leaflet + React-Leaflet** for interactive maps on the Delivery Agent dashboard and customer order tracking.
- **Geolocation API** (`navigator.geolocation`) for detecting user's current location on the Customer Home page search bar.
- **OSRM** (Open Source Routing Machine) powers the route polyline shown between restaurant and delivery agent.

---

## 📜 Scripts

```bash
npm run dev       # Start development server (HMR enabled)
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
npm run lint      # Run ESLint checks
```

---

## 🎨 Design System

The design is driven by CSS custom properties defined in `src/index.css`:

- **Primary**: Orange gradient (`--color-primary`, `--color-primary-dark`)
- **Secondary**: Dark navy/blue (`--color-secondary`)
- **Neutral**: White-light grey surfaces
- **Typography**: System font stack with Inter as the preferred face
- **Motion**: Subtle fade, slide, and scale animations via CSS keyframes

All Tailwind utility classes layer on top of these tokens for a consistent, cohesive look across all portals.
