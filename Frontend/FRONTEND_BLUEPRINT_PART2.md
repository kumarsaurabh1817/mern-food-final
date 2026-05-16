## SECTION 5 – OWNER PAGES

### 5.1 OwnerDashboard
**File**: `src/pages/owner/OwnerDashboard.jsx`
**Route**: `/owner` (within OwnerLayout)

**Description**: The main control room for restaurant owners. Shows KPI cards, live order queue, weekly revenue chart, activity feed, top items, order status donut chart, and payment split.

**Child Components**:
```
OwnerDashboard
├── Header: "Control Room" + "{ShopName} · {today's date}"
├── KPI Cards grid (3 columns: sm:2, lg:3)
│   ├── KPICard: "Today's Revenue" (₹ prefix, animated count-up, TrendingUp/Down vs yesterday %)
│   ├── KPICard: "Orders Today" (count, animated, trend delta)
│   └── KPICard: "Pending Now" (count, pulsing orange dot if > 0, no delta)
├── Middle grid (1 col mobile / 3fr+2fr on lg)
│   ├── Live Orders panel (white card)
│   │   ├── Header: Activity icon + "Live Orders" + count badge + "View all →" link
│   │   ├── Empty: ShoppingBag icon + "No orders yet today"
│   │   └── Scrollable list (max-h: 420px) of OrderCard components
│   │       └── OrderCard (for each of last 8 orders, sorted pending-first)
│   │           ├── Order ID (#XXXXXX monospace) + "Xm ago" + pulsing dot (if pending) + volume icon (if new)
│   │           ├── Customer name + items summary (truncated)
│   │           ├── Amount (₹) + Status badge (colored)
│   │           └── Action row (only if status=pending):
│   │               ├── Initial state: "Accept" (green) + "Cancel" (red) buttons
│   │               └── Accepting state: prep time input (number, default 15) + "Confirm" + "Cancel"
│   └── Right panel (flex-col, gap-20px)
│       ├── Revenue chart card (white)
│       │   ├── "This Week" title + total revenue
│       │   └── Bar chart (7 bars, proportional height, tooltip on hover showing ₹amount)
│       └── Recent Activity feed (white card)
│           ├── "Recent Activity" title
│           └── Activity items (icon + text + relative time e.g. "2m ago")
├── Bottom stats grid (3 columns on lg)
│   ├── "🏆 Top Items This Week" card
│   │   └── Ranked list (#1 gold, #2 silver, #3 orange) - item name + "X sold"
│   ├── "📊 Order Status" donut chart card
│   │   ├── CSS conic-gradient donut (Delivered: green, Pending: amber, Cancelled: red)
│   │   └── Legend: Delivered X%, Pending X%, Cancelled X%
│   └── "💳 Payment Split" card
│       ├── Online: X% (orange progress bar)
│       └── Cash on Delivery: X% (dark progress bar)
└── No-shop state (if shop not created yet)
    └── 🏪 emoji + "No shop yet" + "Set Up Shop →" CTA button
```

**API Calls**:
- `GET /shops/owner/me` — shop info
- `GET /orders?limit=50` — recent orders
- `GET /orders/analytics?days=7` — analytics (revenue, order counts, top items, activity, payment split)

**Logic**:
- `handleAccept(order, prepTime)`: `PATCH /orders/:id/confirm` with `{preparationTime}`
- `handleCancel(order)`: window.confirm → `PATCH /orders/:id/cancel`
- KPICard uses `useCountUp` hook for animated number from 0 to target
- Revenue chart: bar heights proportional to max revenue day

---

### 5.2 OwnerOrdersPage
**File**: `src/pages/owner/OwnerOrdersPage.jsx`
**Route**: `/owner/orders` (within OwnerLayout)

**Description**: Full order management page. Shows active vs history orders. Allows owners to advance order through status pipeline.

**Child Components**:
```
OwnerOrdersPage
├── Header: "Orders" title + "Track and action your live queue" + Refresh button (spinner when refreshing)
├── Tab switcher
│   ├── "Active" tab (pending/confirmed/preparing/ready_for_pickup/out_for_delivery)
│   │   └── Count badge (orange pill)
│   └── "History" tab (delivered + cancelled)
├── Empty state: Package icon + "No active orders" or "No order history"
└── Order list (flex-col, gap-14px)
    └── OrderCard (for each filtered order)
        ├── Header row: Order ID (monospace, #XXXXXXXX) + timestamp
        ├── Status badge (colored, right-aligned)
        ├── Items table (soft gray card)
        │   ├── Each item: "qty× name" + ₹price (right)
        │   └── Total row: "Total" label + ₹amount
        ├── Delivery address (Package icon + street, city)
        └── Action buttons (conditional on status):
            ├── status=pending:
            │   ├── Initial: "✓ Accept" (green) + "✗ Cancel" (red)
            │   └── Accepting: prep time input (5-120 min) + "Confirm" + "Cancel"
            ├── status=confirmed: "🍳 Start Preparing" button (primary)
            └── status=preparing: "🚲 Mark Ready for Pickup" button (primary)
```

**Logic**:
- `confirmOrder`: `PATCH /orders/:id/confirm` with `{preparationTime}`
- `markPreparing`: `PATCH /orders/:id/preparing`
- `markReady`: `PATCH /orders/:id/ready`
- `cancel`: window.confirm → `PATCH /orders/:id/cancel`
- Auto-refreshes via button; no real-time socket on this page

---

### 5.3 MenuPage
**File**: `src/pages/owner/MenuPage.jsx`
**Route**: `/owner/menu` (within OwnerLayout)

**Description**: Full menu management CRUD. Shows items grouped by category with inline availability toggle and edit/delete actions. Add/edit via a modal overlay form.

**Child Components**:
```
MenuPage
├── Modal overlay: MenuItemForm (shown when showForm=true)
│   ├── Header: "Add Menu Item" or "Edit Item" + X close button
│   ├── Name field (required)
│   ├── Description textarea
│   ├── Price (₹) + Category (dropdown) — 2-col grid
│   │   Categories: Starters, Main Course, Breads, Rice, Beverages, Desserts, Extras
│   ├── Image URL field (optional)
│   ├── Checkboxes: "Vegetarian" (green indicator dot) + "Available"
│   └── Footer: "Cancel" (ghost) + "Save Item" (primary, disabled if no name/price)
├── Page header: "Menu" title + "{N} items across {K} categories" + "Add Item" button
├── No-shop state: Store icon + "No shop found" + "Create Shop" button
├── Empty items state: UtensilsCrossed icon + "No menu items yet"
└── Items grouped by category
    └── For each category group:
        ├── Category label (uppercase, gray, 11px)
        └── Item list (owner-list class)
            └── For each item:
                ├── Item image (54x54, rounded-12px, 55% opacity if unavailable)
                ├── Veg/non-veg indicator (green/red square dot)
                ├── Item name (bold, 13px)
                ├── Price (orange, bold)
                └── Action buttons (right-aligned)
                    ├── Availability chip ("In Stock" green / "Out" red — clickable toggle)
                    ├── Edit button (pencil icon, ghost)
                    └── Delete button (trash icon, red ghost)
```

**API Calls**:
- `GET /shops/owner/me` — shop + menu data
- `POST /shops/:shopId/menu` — add item
- `PATCH /shops/:shopId/menu/:itemId` — update item
- `PATCH /shops/:shopId/menu/:itemId/toggle-stock` — toggle availability
- `DELETE /shops/:shopId/menu/:itemId` — delete item

---

### 5.4 ShopSetupPage
**File**: `src/pages/owner/ShopSetupPage.jsx`
**Route**: `/owner/shop` (within OwnerLayout)
**Context**: receives `{ shop, setShop, refreshShop }` from OwnerLayout via `useOutletContext`

**Description**: Create or edit the restaurant profile. All fields in one form with 3 section cards.

**Child Components**:
```
ShopSetupPage
├── Header: "My Shop" title + "Manage your restaurant details" or "Set up your restaurant"
│   └── Open/Closed toggle chip (green "Open" or red "Closed" — clickable)
├── Pending approval banner (amber warning, if shop.isApproved=false)
├── <form>
│   ├── Card: "🏪 Basic Info"
│   │   ├── Restaurant Name input (required)
│   │   ├── Description textarea (3 rows)
│   │   └── Category dropdown (Indian/Chinese/Fast Food/Pizza/Biryani/Desserts/Beverages/Other)
│   ├── Card: "📍 Location"
│   │   ├── Street Address input
│   │   ├── City + State inputs (2-col grid)
│   │   └── Delivery Radius (km) number input (0–80000)
│   ├── Card: "🕐 Operating Hours"
│   │   ├── Opens At (time input)
│   │   └── Closes At (time input)
│   └── Submit button: "Create Shop" or "Save Changes" (full-width, orange, loading spinner)
```

**Logic**:
- If `shop` exists: `PATCH /shops/:shopId` (update)
- If no shop: `POST /shops` (create) → triggers "Awaiting admin approval" toast
- `toggleOpen`: `PATCH /shops/:shopId/toggle-open` → updates local state + layout state

---

## SECTION 6 – DELIVERY AGENT PAGES

### 6.1 DeliveryDashboard
**File**: `src/pages/delivery/DeliveryDashboard.jsx`
**Route**: `/delivery` (within DeliveryLayout)
**Note**: This page fills the FULL viewport height (overflow hidden, fixed layout)

**Description**: Split-pane live operations dashboard. LEFT 50%: order pool + active delivery list. RIGHT 50%: interactive Leaflet map or Google Maps directions.

**IMPORTANT — Approval Gate**: If `user.isApprovedByAdmin=false`, shows a full-screen "Awaiting Approval" card instead of the dashboard.

**Child Components**:
```
DeliveryDashboard
├── [if not approved] Approval gate card
│   └── AlertCircle icon + "Awaiting Approval" + "Your account is pending admin review."
└── [if approved] Split-pane layout (flex, full viewport height)
    ├── LEFT SIDEBAR (50%, min 360px, max 560px, overflow hidden, bg-gray-50)
    │   ├── Agent header (orange gradient if online, dark gray if offline)
    │   │   ├── Status label + Agent first name (large)
    │   │   ├── Today's Earnings (₹amount)
    │   │   └── Online toggle row
    │   │       ├── Status dot (green pulse if online)
    │   │       ├── "Online — Ready for orders" or "Offline" text
    │   │       └── Toggle switch (green when online)
    │   ├── Search + Tab bar
    │   │   ├── Search input (restaurant name filter)
    │   │   ├── "Available (N)" tab + "Active (N)" tab
    │   │   └── Refresh button (spinning when refreshing)
    │   └── Scrollable order list
    │       ├── Empty state: 🎯 or 📦 emoji + message
    │       ├── Available tab → PoolCard list
    │       │   └── PoolCard (for each available order in pool)
    │       │       ├── Restaurant name + #OrderID
    │       │       ├── Amount (₹, orange) + "~25 min"
    │       │       ├── Route preview: pickup → drop (dots and line)
    │       │       ├── Delivery address callout (red-50 card)
    │       │       │   └── Address line, landmark, city/state, PIN
    │       │       └── "Accept Order" button (full-width orange)
    │       └── Active tab → ActiveCard list
    │           └── ActiveCard (for each of agent's active orders)
    │               ├── Restaurant name + #OrderID + status badge
    │               ├── Amount (₹)
    │               ├── Items preview (first 3 items)
    │               ├── Delivery address (red-50 card, MapPin icon)
    │               ├── "Open in Maps" link (if address available)
    │               ├── OTP input (only if status=out_for_delivery)
    │               │   ├── Text input (maxLength 6, dark background, center tracked)
    │               │   └── "Done" button (green, CheckCircle2 icon)
    │               └── Cancel/Release section
    │                   ├── "Cancel Order" button (red outline)
    │                   └── Confirm dialog: "Yes, Release" + "Go Back"
    └── RIGHT MAP (flex-1, relative overflow hidden)
        ├── Floating map search bar (top-center, visible when NOT in active delivery)
        │   ├── Search icon + text input (location search via Nominatim)
        │   └── Dropdown results list (max-h-52, scrollable)
        ├── "Navigating to customer" pill (orange, visible when route is active)
        ├── Bottom status banner (white glass, centered)
        │   └── Dot + text: "Go online..." / "Delivering — live tracking active" / "N orders nearby" / "Waiting..."
        ├── When active delivery + route:
        │   └── Google Maps embed iframe (full map size, directions mode)
        │       + "Open in Google Maps" link (bottom-right overlay)
        └── When no active delivery:
            └── Leaflet MapContainer (CartoDB voyager tiles)
                ├── FitBounds controller (auto-zooms to rider + destinations)
                ├── FlyToLocation controller (smooth fly-to on search result)
                ├── Rider marker (🛵 orange circle, 42px)
                ├── Drop destination marker (📍 red circle, 36px) — when active delivery
                ├── Route polyline (orange, weight 5) — via OSRM routing API
                ├── Search result marker (🔍 purple circle) — when location searched
                └── Pool order pickup markers (📦 blue circles, up to 5)
```

**API Calls**:
- `GET /delivery/me` — agent profile + isOnline status
- `GET /delivery/earnings` — today's earnings
- `GET /delivery/pool` — available orders (only if online)
- `GET /orders` — agent's active orders
- `PATCH /delivery/toggle-duty` — go online/offline
- `POST /delivery/accept/:orderId` — accept order
- `POST /orders/:orderId/verify-otp` — verify delivery OTP
- `POST /delivery/release/:orderId` — release order back to pool

**Real-time**:
- Socket.IO: `emit('updateLocation', {orderId, lat, lng})` when GPS position changes
- GPS watchPosition when `status=out_for_delivery` → emits location to socket
- OSRM route fetched on each GPS update

---

## SECTION 7 – ADMIN PAGES

### 7.1 AdminDashboard
**File**: `src/pages/admin/AdminDashboard.jsx`
**Route**: `/admin` (within AdminLayout)

**Description**: Platform overview with revenue banner, KPI cards, and recent orders table.

**Child Components**:
```
AdminDashboard
├── Heading: "Platform Overview" + "Welcome back, Admin" subtitle
├── Revenue banner (orange gradient, rounded-[2rem], decorative blurred circles)
│   ├── Activity icon + "Platform Revenue" label
│   └── ₹{totalCommission} (large, bold) + "Total commission from delivered orders"
├── Stats grid (3 columns: sm:3)
│   ├── Stat card (Link): Total Users → /admin/users (Users icon, blue)
│   ├── Stat card (Link): Restaurants → /admin/shops (Store icon, orange)
│   └── Stat card (Link): Pending Approvals → /admin/users (Clock icon, amber)
│       └── Each card: icon square + large number + label
└── Recent Orders card (white, rounded-[2rem])
    ├── Header: "Recent Orders" + "View All →" link
    ├── Empty state: ShoppingBag icon + "No orders found"
    └── Table (overflow-x-auto)
        ├── Columns: Order ID | Restaurant | Status | Amount
        └── Rows: #ID (monospace) | shop name | status badge | ₹amount
```

**API Calls**:
- `GET /admin/dashboard` — activeUsers, totalOrders, totalCommission
- `GET /admin/users?isApprovedByAdmin=false` — pending approvals count
- `GET /admin/shops` — total shops count
- `GET /orders?limit=5` — recent orders

---

### 7.2 AdminUsersPage
**File**: `src/pages/admin/AdminUsersPage.jsx`
**Route**: `/admin/users` (within AdminLayout)

**Description**: User management table with search, role filter, approve, and block/unblock actions.

**Child Components**:
```
AdminUsersPage
├── Controls row (flex, md:row)
│   ├── Search input (Search icon, full-width, "Search by name or ID...")
│   └── Role filter dropdown (Filter icon)
│       └── Options: All Roles / Customers / Owners / Delivery / Admins
├── Users table (white card, rounded-[2rem], overflow-x-auto)
│   ├── Columns: User | Role | Status | Joined | Actions
│   └── For each user row:
│       ├── Avatar (orange circle, initials) + Name + phone number
│       ├── Role badge (icon + label, colored by role)
│       │   Colors: user=blue, owner=orange, delivery_boy=teal, admin=purple
│       ├── Status badge: Blocked (red) / Approved (green) / Pending (amber) / Active (gray)
│       ├── Join date
│       └── Action buttons:
│           ├── "Approve" (green) — only if pending owner/delivery_boy and not blocked
│           └── "Block"/"Unblock" (red/blue) — not for admins
└── Empty state: User icon + "No users found"
```

**API Calls**:
- `GET /admin/users?limit=1000` — all users
- `PATCH /admin/users/:id/approve` — approve owner/delivery
- `PATCH /admin/users/:id/block` — toggle block status

---

### 7.3 AdminShopsPage
**File**: `src/pages/admin/AdminShopsPage.jsx`
**Route**: `/admin/shops` (within AdminLayout)

**Description**: Shop management with card grid UI. Filter by status. Approve pending shops or suspend/reinstate active shops.

**Child Components**:
```
AdminShopsPage
├── Controls row
│   ├── Search input (name or city)
│   └── Status filter dropdown
│       └── Options: All Shops / Pending Approval / Active / Suspended
├── Empty state: Store icon + "No shops found"
└── Card grid (1 col / md:2 / lg:3)
    └── ShopCard (for each filtered shop)
        ├── Image (h-40, object-cover, zoom on hover)
        ├── Gradient overlay (bottom)
        ├── Shop name (white, bold, bottom-left)
        ├── Category (white, uppercase, bottom-left below name)
        ├── Status badge (top-right): "Suspended" red / "Active" green / "Pending" amber
        └── Card body (p-5)
            ├── City (MapPin icon)
            └── Action buttons:
                ├── "✓ Approve" (green) — only if not yet approved and not suspended
                └── "Suspend"/"Reinstate" (red/blue toggle)
```

**API Calls**:
- `GET /admin/shops?limit=1000` — all shops
- `PATCH /admin/shops/:id/approve` — approve shop
- `PATCH /admin/shops/:id/suspend` — toggle suspend

---

## SECTION 8 – SHARED & UTILITY COMPONENTS

### 8.1 Toast (src/components/ui/Toast.jsx)
- Fixed position notification (top-right or top-center)
- Auto-dismisses after ~3 seconds
- Types: `success` (green), `error` (red), `info` (blue)
- Driven by Redux `ui.toast` state
- Slide-in animation

### 8.2 ClearCartModal (src/components/cart/ClearCartModal.jsx)
- Appears when user tries to add item from Restaurant B while cart has items from Restaurant A
- Modal overlay with: warning icon + "Start fresh order?" message + "Yes, clear cart" (orange) + "Keep current cart" (ghost)
- "Yes, clear": dispatches `clearShopAndAddItem` (clears old items, adds new item)
- Driven by Redux `ui.clearCartModal` state

### 8.3 NotFoundPage (src/pages/NotFoundPage.jsx)
- Route: `*` (catch-all)
- 404 page with illustration or emoji, "Page not found" message, "Go Home" button

---

## SECTION 9 – API REFERENCE (Key Endpoints)

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/signup | Register new user |
| POST | /auth/login | Login, returns accessToken |
| POST | /auth/logout | Clear refresh token cookie |
| POST | /auth/refresh | Refresh access token via cookie |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /users/me | Get current user profile |
| PATCH | /users/me | Update name/phone |
| POST | /users/me/change-password | Change password |

### Shops
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /shops | All shops (public) |
| GET | /shops/:id | Single shop with menu |
| GET | /shops/owner/me | Owner's own shop |
| POST | /shops | Create shop (owner) |
| PATCH | /shops/:id | Update shop (owner) |
| PATCH | /shops/:id/toggle-open | Open/close shop |
| POST | /shops/:id/menu | Add menu item |
| PATCH | /shops/:id/menu/:itemId | Update menu item |
| PATCH | /shops/:id/menu/:itemId/toggle-stock | Toggle item availability |
| DELETE | /shops/:id/menu/:itemId | Delete menu item |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /orders | Get orders (role-filtered) |
| POST | /orders | Place order |
| GET | /orders/:id | Single order details |
| POST | /orders/:id/verify-payment | Verify Razorpay payment |
| PATCH | /orders/:id/confirm | Owner confirms order |
| PATCH | /orders/:id/preparing | Mark as preparing |
| PATCH | /orders/:id/ready | Mark ready for pickup |
| PATCH | /orders/:id/cancel | Cancel order |
| POST | /orders/:id/verify-otp | Delivery agent verifies OTP |
| GET | /orders/analytics | Owner analytics (revenue, counts, top items) |

### Delivery
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /delivery/me | Agent profile |
| GET | /delivery/earnings | Today's earnings |
| GET | /delivery/pool | Available orders in pool |
| PATCH | /delivery/toggle-duty | Toggle online/offline |
| POST | /delivery/accept/:id | Accept order |
| POST | /delivery/release/:id | Release order back to pool |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/dashboard | Platform stats |
| GET | /admin/users | All users (filterable) |
| PATCH | /admin/users/:id/approve | Approve owner/delivery |
| PATCH | /admin/users/:id/block | Block/unblock user |
| GET | /admin/shops | All shops |
| PATCH | /admin/shops/:id/approve | Approve shop |
| PATCH | /admin/shops/:id/suspend | Suspend/reinstate shop |

---

## SECTION 10 – SOCKET.IO EVENTS

### Customer (OrderTrackingPage)
| Direction | Event | Payload | Description |
|-----------|-------|---------|-------------|
| Emit | `joinOrderRoom` | `orderId` | Join real-time updates for this order |
| Listen | `agentLocationUpdated` | `{lat, lng}` | Agent GPS coordinates |
| Listen | `order:status` | `{status, deliveryAgent}` | Status change |
| Listen | `order:cancelled` | `{message}` | Order cancelled by owner/admin |

### Delivery Agent (DeliveryDashboard)
| Direction | Event | Payload | Description |
|-----------|-------|---------|-------------|
| Emit | `joinOrderRoom` | `orderId` | Join order room for active delivery |
| Emit | `updateLocation` | `{orderId, lat, lng}` | Broadcast agent GPS |

---

## SECTION 11 – ROUTE MAP (Complete)

```
/ ────────────────── HomePage (Customer)
/restaurants ──────── AllRestaurantsPage (Customer)
/restaurant/:id ───── RestaurantPage (Customer)
/cart ─────────────── CartPage (Customer)
/checkout ─────────── CheckoutPage (Customer)
/orders ───────────── OrdersPage (Customer)
/track/:orderId ───── OrderTrackingPage (Customer)
/profile ──────────── ProfilePage (Customer)

/owner ─────────────── OwnerDashboard
/owner/orders ─────── OwnerOrdersPage
/owner/menu ────────── MenuPage
/owner/shop ────────── ShopSetupPage
/owner/profile ─────── ProfilePage (shared)

/delivery ──────────── DeliveryDashboard
/delivery/profile ──── ProfilePage (shared)

/admin ─────────────── AdminDashboard
/admin/users ───────── AdminUsersPage
/admin/shops ───────── AdminShopsPage
/admin/profile ─────── ProfilePage (shared)

/login ─────────────── LoginPage (Guest only)
/signup ────────────── SignupPage (Guest only)
/forgot-password ───── ForgotPasswordPage (Guest only)
/reset-password/:token  ResetPasswordPage (Public)
* ──────────────────── NotFoundPage
```

---

## SECTION 12 – DESIGN SYSTEM NOTES FOR STITCH

### Color Palette
```css
--primary: #FF7A00         /* Orange — CTA buttons, active states, badges */
--primary-dark: #FF5200    /* Darker orange for hover/gradient end */
--primary-glow: rgba(255,122,0,0.12)  /* Subtle orange tint backgrounds */
--accent: #FF9F43          /* Light orange for gradients */
--navy: #1E3A5F            /* Sidebar backgrounds */
--success: #22C55E         /* Online status, veg, approved */
--error: #EF4444           /* Closed, blocked, errors */
--warning: #F59E0B         /* Pending status */
--bg-dark: #0F0F0F         /* Customer dark background */
--bg-card: #FFFFFF         /* Card backgrounds */
--border: #E5E7EB          /* Default borders */
--text-primary: #1A1A1A    /* Main text */
--text-secondary: #374151  /* Secondary text */
--text-muted: #6B7280      /* Muted/helper text */
```

### Typography
- Font family: `'Plus Jakarta Sans', sans-serif`
- Page titles: 24-30px, weight 800-900, letter-spacing -0.03em
- Section headings: 20-22px, weight 800
- Body: 13-14px, weight 500-600
- Labels: 12px, weight 700, uppercase, letter-spacing 0.05em

### Component Patterns
- **Buttons (Primary)**: orange gradient, `border-radius: 14px`, `box-shadow: 0 6px 20px rgba(255,122,0,0.35)`
- **Cards**: white, `border: 1px solid #E5E7EB`, `border-radius: 20px`, `box-shadow: 0 2px 8px rgba(0,0,0,0.05)`
- **Status Pills**: `border-radius: 100px`, `font-size: 11px`, `font-weight: 700`, `text-transform: uppercase`, colored bg+text+border
- **Skeleton Loading**: gray shimmer animation div placeholders
- **Hover on cards**: `translateY(-4px)` + elevated shadow
- **Active nav items**: orange glow background or full orange gradient
- **Glassmorphism headers**: `background: rgba(255,255,255,0.9)`, `backdrop-filter: blur(16px)`

### Mobile Responsiveness
- Customer: Desktop = top navbar, Mobile = bottom tab bar + cart FAB
- Owner: Sidebar always visible (no mobile collapse currently)
- Admin: Sidebar hidden on mobile, shows via hamburger → slide-in
- Delivery: Fixed split-pane (designed for tablet/desktop, scrolls on mobile)

### Animations
- `animate-slide-up`: fade-up on mount (staggered with `animation-delay`)
- `animate-ping`: pulsing circle for pending orders dot
- `animate-spin`: loading spinners
- `animate-pulse-green`: gentle pulse for live/active indicators
- Count-up animation: custom `useCountUp` hook for KPI numbers

---
*End of OrangeBite Frontend Blueprint*
