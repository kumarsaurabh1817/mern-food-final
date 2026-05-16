# OrangeBite Frontend – Complete UI Blueprint
## (For Google Stitch AI Frontend Generation)

---

## SECTION 1 – APPLICATION CONTEXT

### What is OrangeBite?
OrangeBite is a **full-stack food delivery platform** (like Swiggy/Zomato) built with the MERN stack. It supports four distinct user roles: **Customer**, **Restaurant Owner**, **Delivery Agent**, and **Admin**. Each role has a completely separate set of pages and UI. The app name is "Orange Bite" with a brand color of `#FF7A00` (orange).

### Tech Stack
- **Frontend**: React 19, Vite, Redux Toolkit, React Router v7, Tailwind CSS v4, Axios, Socket.IO Client, Leaflet/React-Leaflet (maps), Lucide React (icons)
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.IO, JWT Auth (access token + HttpOnly refresh cookie), Razorpay payments
- **State Management**: Redux Toolkit with 3 slices — `auth`, `cart`, `ui`
- **API Base URL**: `VITE_API_URL` env var (default `http://localhost:5000`)
- **Real-time**: Socket.IO for live order tracking and delivery agent location

### Brand & Design Tokens
- Primary: `#FF7A00` (orange), Primary Dark: `#FF5200`
- Secondary/Navy: `#1E3A5F` (used for sidebars)
- Background Dark: `#0F0F0F` or `#F5F7FA` (light mode)
- Font: `Plus Jakarta Sans` (Google Font)
- Cards: white with `1px solid #E5E7EB` border, `border-radius: 20px`

### User Roles & Entry Points
| Role | Entry Route | Home |
|------|-------------|------|
| Customer | `/login` → `/` | HomePage |
| Owner | `/login` → `/owner` | OwnerDashboard |
| Delivery Agent | `/login` → `/delivery` | DeliveryDashboard |
| Admin | `/login` → `/admin` | AdminDashboard |

### Auth Flow
- JWT access token stored in `localStorage`
- Refresh token in HttpOnly cookie (auto-refreshed via axios interceptor)
- `loadSession()` thunk runs on app mount to restore session
- `ProtectedRoute` guards role-specific routes; `GuestRoute` blocks authenticated users from `/login`
- Owner & Delivery accounts require **admin approval** (`isApprovedByAdmin` flag)

### Global Redux State
```
store = {
  auth: { user, session, loading, error }
  cart: { items[], shopId, shopName }
  ui: { sidebarOpen, cartOpen, clearCartModal, toast }
}
```

### Global Components (rendered in App.jsx)
- `<Toast />` — fixed notification, auto-dismisses (success/error/info types)
- `<ClearCartModal />` — modal that fires when user adds item from a DIFFERENT restaurant than what's already in cart. Asks "Clear cart and switch?" 

---

## SECTION 2 – LAYOUT WRAPPERS

### 2.1 CustomerLayout
**File**: `src/layouts/CustomerLayout.jsx`
**Role**: wraps all customer pages (`/`, `/restaurant/:id`, `/cart`, etc.)

**Structure**:
```
CustomerLayout
├── <header> (sticky, glassmorphism, white/90 + blur)
│   ├── Logo (Orange Bite + Zap icon, orange gradient)
│   └── <nav> (desktop, hidden on mobile)
│       ├── NavLink: Home (/)
│       ├── NavLink: Orders (/orders)
│       ├── NavLink: Cart (/cart) [shows animated orange dot badge]
│       ├── NavLink: Profile (/profile)
│       └── SignOut button (icon only)
├── <main> (Outlet renders page here, paddingBottom: 80px)
├── Cart FAB (fixed, bottom-right, only visible when cartCount > 0)
│   └── ShoppingCart icon + count badge
└── Mobile Bottom Nav (fixed, 64px height, shows on <640px)
    ├── Home icon + label
    ├── Orders icon + label
    ├── Cart icon + count badge
    ├── Profile icon + label
    └── Logout button + label
```
**Logic**: `isActive(path)` highlights current route. Cart count from Redux `selectCartCount`. Sign out dispatches `signOut()` thunk then navigates to `/login`.

---

### 2.2 OwnerLayout
**File**: `src/layouts/OwnerLayout.jsx`
**Role**: wraps all owner pages (`/owner`, `/owner/orders`, `/owner/menu`, `/owner/shop`, `/owner/profile`)

**Structure**:
```
OwnerLayout
├── Desktop Sidebar (240px wide, sticky, navy #1E3A5F background)
│   ├── Logo section (Orange Bite logo + "Owner Panel" badge)
│   ├── Profile strip (avatar initials, name, Online/Closed dot)
│   ├── Nav links
│   │   ├── Dashboard (/owner)
│   │   ├── Orders (/owner/orders)
│   │   ├── Menu (/owner/menu)
│   │   ├── Shop Settings (/owner/shop)
│   │   └── My Profile (/owner/profile)
│   └── Bottom section
│       ├── Shop Live Toggle (green/red pill with animated toggle switch)
│       └── Sign Out button
└── Main content area (flex-1)
    └── <Outlet context={{ shop, setShop, refreshShop }}> 
```
**Logic**: On mount, fetches `/shops/owner/me` to get shop status. `handleToggleShop` calls `PATCH /shops/:id/toggle-open`. Active route highlighted with orange gradient background on nav link. Provides shop context to child pages via `useOutletContext`.

---

### 2.3 DeliveryLayout
**File**: `src/layouts/DeliveryLayout.jsx`
**Role**: wraps delivery agent pages (`/delivery`, `/delivery/profile`)

**Structure**:
```
DeliveryLayout
├── Slim header (50px height, white, subtle shadow)
│   ├── Brand: Orange Bite logo + "Partner" badge (orange)
│   └── Right side
│       ├── Profile avatar link → /delivery/profile (shows initials)
│       └── Sign Out button (icon)
└── <main> 
    └── <Outlet /> 
    Note: Dashboard fills 100vh (overflow:hidden). Profile is scrollable.
```

---

### 2.4 AdminLayout
**File**: `src/layouts/AdminLayout.jsx`
**Role**: wraps admin pages (`/admin`, `/admin/users`, `/admin/shops`, `/admin/profile`)

**Structure**:
```
AdminLayout
├── Sidebar (fixed, 240px, navy #1E3A5F, lg:always visible, mobile:slide-in)
│   ├── Logo + "Admin Panel" label
│   ├── Nav links
│   │   ├── Dashboard (/admin)
│   │   ├── Users (/admin/users)
│   │   ├── Shops (/admin/shops)
│   │   └── My Profile (/admin/profile)
│   └── Bottom: user avatar + name + "Administrator · Edit Profile" + Sign Out
├── Mobile overlay (black/50 backdrop, closes sidebar on click)
└── Main area (lg:ml-60)
    ├── Top header bar (14px height, white, shows current page title + hamburger on mobile)
    └── <main className="p-6"> → <Outlet />
```

---

## SECTION 3 – AUTH PAGES

### 3.1 LoginPage
**File**: `src/pages/auth/LoginPage.jsx`
**Route**: `/login` (GuestRoute — redirects logged-in users away)

**Description**: Standard login form with email + password. Has demo user quick-fill buttons for all 4 roles.

**Child Components**:
```
LoginPage
└── AuthLayout (centered card layout, white card on gradient/pattern background)
    ├── Page heading ("Sign In" + "Welcome back")
    ├── Error banner (red, if auth error)
    ├── <form>
    │   ├── InputField: Email (icon: Mail, type: email)
    │   ├── InputField: Password (icon: Lock, toggle show/hide, "Forgot password?" link)
    │   └── Button: "Sign In" (loading spinner state)
    ├── Divider: "or continue with"
    ├── Demo user chips (4 buttons: Customer, Owner, Delivery, Admin)
    └── Footer links: "Don't have an account? Sign up" + "Create new account" button
```

**Logic**:
- Validates email format + non-empty password
- Dispatches `signIn({email, password})` Redux thunk
- On success: routes to role-specific home (`/`, `/owner`, `/delivery`, `/admin`)
- Demo fill: sets email + password='demo1234'

**AuthLayout sub-component** (`src/components/auth/AuthLayout.jsx`):
- Two-panel layout on desktop (left: brand panel with orange gradient + food imagery, right: form)
- Single column on mobile (form only, brand collapses)

**InputField sub-component** (`src/components/auth/InputField.jsx`):
- Labeled input with icon prefix, optional end-icon button, error message below

**Button sub-component** (`src/components/auth/Button.jsx`):
- Orange gradient button, shows spinner when `isLoading=true`

---

### 3.2 SignupPage
**File**: `src/pages/auth/SignupPage.jsx`
**Route**: `/signup` (GuestRoute)

**Description**: Registration form with role selection. Customers auto-login. Owner/Delivery require admin approval.

**Child Components**:
```
SignupPage
└── AuthLayout
    ├── Page heading ("Create Account" + "Join Orange Bite")
    ├── Error banner
    ├── <form>
    │   ├── Role Cards grid (3 cards: Customer, Restaurant Owner, Delivery Agent)
    │   │   └── RoleCard component: icon + label + description, selected state = orange border
    │   ├── InputField: Full Name + InputField: Email (2-col grid)
    │   ├── InputField: Phone (optional) + InputField: Password (2-col grid)
    │   ├── Password strength bar (Weak/Fair/Good/Strong with color)
    │   ├── Approval notice banner (amber, if role is owner or delivery_boy)
    │   └── Button: "Create Account"
    └── Footer: "Already have account? Sign in" link
```

**Logic**:
- Role selection sets `form.role` (user/owner/delivery_boy)
- Password strength computed from length, mixed case, numbers/special chars
- Dispatches `signUp(form)` thunk
- Customer: auto-logs in and redirects to `/`
- Owner/Delivery: redirects to `/login` (pending approval)

**RoleCard sub-component** (`src/components/auth/RoleCard.jsx`):
- Card with icon, label, description. Selected = orange border + background.

---

### 3.3 ForgotPasswordPage
**File**: `src/pages/auth/ForgotPasswordPage.jsx`
**Route**: `/forgot-password`

**Description**: Email input form. Sends reset link to email. Shows success state after submission.

**Structure**:
```
ForgotPasswordPage (standalone, no layout wrapper)
├── Centered card (max-w-md)
├── Back to login link
├── Icon + heading ("Reset Password")
├── Success state (green checkmark, "Check your email" message) OR
└── <form>
    ├── InputField: Email address
    └── Submit button "Send Reset Link"
```

---

### 3.4 ResetPasswordPage
**File**: `src/pages/auth/ResetPasswordPage.jsx`
**Route**: `/reset-password/:token` (public, no auth needed)

**Description**: New password form. Token from URL params. Shows success and redirects to login.

**Structure**:
```
ResetPasswordPage (standalone)
├── Centered card
├── New Password input (with show/hide toggle)
├── Confirm Password input
├── Password strength hints
└── Submit button "Reset Password"
```

---

## SECTION 4 – CUSTOMER PAGES

### 4.1 HomePage
**File**: `src/pages/customer/HomePage.jsx`
**Route**: `/` (within CustomerLayout)

**Description**: Main landing page for customers. Shows greeting, location chip, search bar, cuisine category filters, and restaurant grid.

**Child Components**:
```
HomePage
├── Section 1: Hero Search
│   ├── Greeting text ("Good morning/afternoon, {firstName} 👋")
│   ├── Subtext ("What are you craving today?")
│   ├── Location chip (button, shows city name, GPS icon, "Tap to update")
│   │   └── Logic: Nominatim reverse geocode from browser GPS
│   └── Search bar (flat input, Search icon, X clear button)
├── Section 2: Category Chips (horizontal scroll)
│   └── Chip buttons: All 🍽️, Indian 🍛, Chinese 🍜, Fast Food 🍔, Pizza 🍕, Biryani 🍲, Desserts 🍰, Beverages ☕, Other
│       └── Active chip: orange fill, inactive: white card border
├── Section 3: Restaurant Grid
│   ├── Header: "Restaurants Available" or "🔍 Results (N)" + "View All →" link or "Clear ✕"
│   ├── Loading state: 4x SkeletonCard components
│   ├── Empty state: 🍽️ illustration + "No restaurants found" + "Clear Filters" button
│   └── Grid: 2 cols mobile / 3 cols md / 4 cols lg
│       └── ShopCard (repeated for each shop)
│           ├── Shop image (200px tall, zoom on hover)
│           ├── Gradient overlay (black, bottom)
│           ├── Delivery time badge (bottom-left, orange pill)
│           ├── "Promoted" badge (top-left, accent color) — every 0th and 2nd card
│           ├── "Currently Closed" overlay (dark blur) — if shop.isOpen=false
│           ├── Shop name (bold, truncated)
│           ├── Description or category
│           └── "₹X for two · Free delivery" row
```

**Logic**:
- Fetches `GET /shops` on mount
- Client-side filter by `search` + `category` state
- GPS via `navigator.geolocation` + Nominatim API for city name
- ShopCard is a `<Link to="/restaurant/:id">`
- Hover: card lifts (translateY -5px) + orange border + image zoom

---

### 4.2 AllRestaurantsPage
**File**: `src/pages/customer/AllRestaurantsPage.jsx`
**Route**: `/restaurants` (within CustomerLayout)

**Description**: Full listing of ALL open+approved restaurants with search and filters. Has an orange hero banner at top.

**Child Components**:
```
AllRestaurantsPage
├── Hero banner (orange gradient, 28px padding)
│   ├── Back button (← arrow, glass style)
│   ├── Title "All Restaurants" + count subtitle
│   └── Search bar (white, full width, shadow)
├── Cuisine filter chips (horizontal scroll, same as HomePage)
├── Results header ("N open restaurants" or "N results found" + "Clear filters" button)
├── Loading: 6x SkeletonCard
├── Empty state: 🍽️ + message + "Clear Filters" button
└── Grid (auto-fill, min 260px per card)
    └── ShopCard (same structure as HomePage but with "OPEN" badge top-left)
        ├── Image + Open/Category badges
        └── Info: name, description, "🕐 X-Y min · 🛵 ₹30 delivery · Order →"
```

**Logic**: Only shows `isOpen=true AND isApproved=true` shops. Client-side search + category filter.

---

### 4.3 RestaurantPage
**File**: `src/pages/customer/RestaurantPage.jsx`
**Route**: `/restaurant/:id` (within CustomerLayout)

**Description**: Individual restaurant page. Shows restaurant details in a hero section and full scrollable menu with category tabs, search, and veg filter.

**Child Components**:
```
RestaurantPage
├── Mobile sticky top bar (back arrow, heart/share buttons)
├── Two-column hero (left: info, right: banner image)
│   ├── Info card (white, rounded-3xl)
│   │   ├── "RESTAURANT" label (orange uppercase)
│   │   ├── Restaurant name (h1, large)
│   │   ├── Description
│   │   ├── Address (MapPin icon)
│   │   ├── Open/Closed badge (animated orange dot or gray)
│   │   ├── "Closed" info banner (red) if not open
│   │   └── Stats row: "25-30 mins" chip, "₹400 for two" chip
│   └── Banner image card (rounded-3xl, overflow hidden)
│       ├── <img> object-cover full height
│       ├── Gradient overlay
│       └── Heart + Share buttons (bottom-left, white circles)
├── Menu section (full-width card, rounded-3xl)
│   ├── Header: "Menu" label + "Browse dishes" title
│   ├── Controls row
│   │   ├── Search input (Search icon + text input)
│   │   └── "Veg only" toggle button (dot indicator, orange when active)
│   ├── Category pills (horizontal scroll, "All" + unique categories from items)
│   │   └── Active: dark navy background; Inactive: gray-50
│   └── Menu items grid (single column, gap-4)
│       └── MenuItemCard (for each filtered item)
│           ├── Left: veg/non-veg indicator + item name + description + price
│           │   └── "In cart X" badge (orange-50) if item is in cart
│           ├── Right: item image (w-28 h-28, rounded-2xl)
│           │   └── "Add" button (below image, white border, orange text)
│           │       OR "Unavailable" label (grayed out)
│           └── If cart has items from DIFFERENT shop: triggers ClearCartModal
└── Sticky bottom bar (only if cartCount > 0)
    ├── "{N} item(s) in cart · Ready to checkout"
    └── "View cart" button (orange, rounded-full, ShoppingCart icon)
```

**Logic**:
- Fetches `GET /shops/:id` (returns shop + menu array)
- Filter: category + vegOnly + search term (client-side)
- `handleAdd`: if `cart.shopId !== shopId`, dispatches `showClearCartModal`; else dispatches `addItem`
- `handleShare`: uses Web Share API or copies URL to clipboard

---

### 4.4 CartPage
**File**: `src/pages/customer/CartPage.jsx`
**Route**: `/cart` (within CustomerLayout)

**Description**: Shopping cart with item list, quantity controls, bill summary, and checkout button.

**Child Components**:
```
CartPage
├── EmptyCart state (if items.length === 0)
│   ├── Animated ping circle + ShoppingCart icon
│   ├── "Your cart is empty"
│   └── "Explore Restaurants" button
└── Cart content (if items exist)
    ├── Header: "Your Cart" title + shop name (Store icon) + "Clear All" button (red)
    ├── Items card (white, rounded-20px)
    │   └── For each item:
    │       ├── Item image (72x72, rounded-12px)
    │       ├── VegDot indicator (green circle = veg, red = non-veg)
    │       ├── Item name (bold, truncated)
    │       ├── Total price for this row (price × qty, orange)
    │       ├── Stepper widget (–  qty  +) (orange border, inline-flex)
    │       └── Per-unit price (right side, muted)
    ├── Bill Details card
    │   ├── Item Total (N items): ₹X
    │   ├── Delivery Fee (Bike icon): ₹30
    │   ├── Platform Fee (Shield icon): ₹5
    │   ├── Divider
    │   └── "To Pay": ₹X (orange, large)
    └── "Proceed to Pay" button (full-width orange gradient)
        ├── Left: grand total + "Total Bill" label
        └── Right: "Proceed to Pay →"
```

**Logic**:
- Reads from Redux `cart` slice
- `Stepper`: `+` dispatches `addItem`, `-` dispatches `removeItem`
- Delivery charge = ₹30 (if items > 0), Platform fee = ₹5
- "Proceed to Pay" navigates to `/checkout`

---

### 4.5 CheckoutPage
**File**: `src/pages/customer/CheckoutPage.jsx`
**Route**: `/checkout` (within CustomerLayout)

**Description**: Multi-step checkout with delivery address (map pin or typed), payment method selection (Online via Razorpay or COD), and order placement.

**Child Components**:
```
CheckoutPage
├── Header: "Checkout" + back button
├── Step 1: Delivery Address
│   ├── Saved addresses list (if user has saved addresses)
│   ├── "Add New Address" form
│   │   ├── Address Line 1 input
│   │   ├── Landmark input
│   │   ├── City + State inputs (grid)
│   │   ├── ZIP code input
│   │   └── "Use My Location" button (GPS pin)
│   └── Map preview (Leaflet) showing selected address pin
├── Step 2: Payment Method
│   ├── Online Payment card (Razorpay, credit/debit/UPI)
│   └── Cash on Delivery card
├── Order Summary sidebar/section
│   ├── Shop name + item list
│   ├── Subtotal, delivery, platform fee, grand total
│   └── "Place Order" button (orange gradient)
└── Loading overlay during order placement
```

**Logic**:
- Fetches user's saved addresses from `GET /users/me`
- Razorpay: calls `POST /orders` → gets Razorpay order ID → opens Razorpay modal via `useRazorpay` hook → on success calls `POST /orders/:id/verify-payment`
- COD: calls `POST /orders` directly with `paymentMethod: 'cod'`
- On success: clears cart, shows toast, navigates to `/track/:orderId`
- Delivery radius validation: checks if address is within shop's `deliveryRadiusKm`
- Idempotency key: client-generated UUID sent in request header

---

### 4.6 OrdersPage
**File**: `src/pages/customer/OrdersPage.jsx`
**Route**: `/orders` (within CustomerLayout)

**Description**: Lists all customer orders with status badges and filter tabs.

**Child Components**:
```
OrdersPage
├── Header: Receipt icon + "My Orders" title + order count
├── Filter tabs (horizontal scroll pills)
│   ├── All Orders
│   ├── Active (not delivered/cancelled)
│   ├── Delivered
│   └── Cancelled
├── Loading: 3x OrderSkeleton
├── Empty state: ShoppingBag icon + message + "Explore Restaurants" button
└── Order list (flex-col, gap-14px)
    └── OrderCard (Link to /track/:orderId)
        ├── Status accent bar (3px top border, colored by status)
        ├── Restaurant image (60x60, rounded-14px)
        ├── Restaurant name + city (MapPin icon)
        ├── Items summary (e.g. "1× Butter Chicken, 2× Naan +1 more")
        ├── Status pill (colored badge: Pending/Confirmed/Preparing/Ready/Out for Delivery/Delivered/Cancelled)
        ├── Delivery OTP box (if order has OTP, dashed orange border, monospace code)
        └── Footer: date+time (Clock icon) + amount (₹) + chevron →
```

**Status Colors**:
- pending: amber, confirmed: blue, preparing: orange, ready_for_pickup: violet, out_for_delivery: cyan, delivered: green, cancelled: red

---

### 4.7 OrderTrackingPage
**File**: `src/pages/customer/OrderTrackingPage.jsx`
**Route**: `/track/:orderId` (within CustomerLayout)

**Description**: Real-time order tracking page with status timeline, OTP display, live map (when out for delivery), and order summary.

**Child Components**:
```
OrderTrackingPage
├── Header: "Order #XXXXXXXX" + "Track your meal" + "LIVE" pulsing badge
├── Cancelled state (if cancelled)
│   └── Red card: X icon + "Order Cancelled" + reason message
├── Status timeline (if not cancelled)
│   └── Vertical stepper: Order Placed → Confirmed → Preparing → Ready for Pickup → On the Way → Delivered
│       ├── Each step: circle icon (filled/gray) + label + "Processing..." pulse on current
│       └── Connected by vertical line (gray, behind circles)
├── Delivery OTP box (if order.deliveryOTP exists)
│   ├── "DELIVERY PIN" label
│   ├── OTP digits displayed in individual white boxes (styled like bank OTP)
│   └── Copy button (Copy icon)
├── Live Map section (only when status = out_for_delivery)
│   ├── Google Maps directions iframe (agent location → customer location)
│   │   OR placeholder if no coordinates
│   ├── "Updated HH:MM" timestamp
│   └── "Open in Google Maps" link
├── Restaurant info card (clickable, navigates back to restaurant page)
│   ├── Restaurant image + name + city
│   └── Chevron →
└── Bill Details card
    ├── Item list (qty × name → ₹price)
    ├── Divider
    └── "Paid via Cash/Online · ₹total"
```

**Logic**:
- Polls `GET /orders/:orderId` every 5 seconds
- Socket.IO: joins `orderRoom` for real-time events: `agentLocationUpdated`, `order:status`, `order:cancelled`
- Agent location → builds Google Maps embed directions URL
- Stops polling when status = delivered or cancelled

---

### 4.8 ProfilePage (Shared)
**File**: `src/pages/customer/ProfilePage.jsx`
**Route**: `/profile` (Customer), `/owner/profile`, `/delivery/profile`, `/admin/profile`
**Note**: Same component used by ALL four roles.

**Description**: User profile management page with personal info editing and password change.

**Child Components**:
```
ProfilePage
├── Header: ← back button + "My Profile" title + subtitle
├── Avatar strip (orange gradient banner)
│   ├── User icon (large, white)
│   ├── Name (white, large bold)
│   ├── Email (white, slightly transparent)
│   └── Role badge (uppercase pill, white/25%)
├── Card: "Personal Information" (User icon)
│   ├── Alert banner (success/error)
│   ├── Field: Full Name (editable if editingProfile=true)
│   ├── Field: Email (always disabled, cannot change)
│   ├── Field: Phone Number (editable)
│   └── Buttons (when not editing): "Edit Profile" button
│       OR (when editing): "Save Changes" + "Cancel" buttons
├── Email info banner (green, "Email is verified and cannot be changed")
└── Card: "Change Password" (Shield icon)
    ├── Alert banner
    ├── Success state: "Redirecting to login in 3 seconds..."
    └── Form:
        ├── Field: Current Password (show/hide toggle)
        ├── Field: New Password (show/hide toggle)
        ├── Field: Confirm Password (show/hide toggle)
        ├── Password strength hints (4 pill badges: 8+ chars, Uppercase, Number, Special char)
        ├── Warning notice "Changing password will log out other devices"
        └── "Change Password" button (dark navy gradient)
```

**Logic**:
- `handleProfileSave`: `PATCH /users/me` with name + phone
- `handlePasswordChange`: `POST /users/me/change-password`; on success → 3s timeout → signOut + navigate('/login')
- `editingProfile` toggle: shows/hides edit controls; cancel reverts form to Redux user data

---
