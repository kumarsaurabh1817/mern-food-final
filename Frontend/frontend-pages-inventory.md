# OrangeBite Frontend Page Inventory

## Application Context
- Product: OrangeBite is a multi-portal food delivery platform for customers, restaurant owners, delivery agents, and platform admins.
- Frontend type: Single-page application (SPA) built with React 19 and Vite 8.
- Styling: Tailwind CSS 4 plus a custom CSS design system in Frontend/src/index.css.
- Routing: React Router DOM 7 with role-based guards (ProtectedRoute, GuestRoute).
- State: Redux Toolkit and React-Redux. Auth, cart, and UI toast state are central to routing and interactions.
- HTTP: Axios instance in Frontend/src/lib/axios.js used across pages for REST calls.
- Real-time: Socket.IO client used for live order status and delivery location updates.
- Maps: React-Leaflet + Leaflet for maps, OSRM for route polylines, and Google Maps embeds for directions.
- Payments: Razorpay flow via Frontend/src/hooks/useRazorpay.js and backend payment endpoints.
- Global UI: Toast and ClearCartModal are mounted at the App root and triggered from pages.
- Build scripts: npm run dev, npm run build, npm run preview, npm run lint.
- Common env vars (used by code/README):
  - VITE_API_BASE_URL
  - VITE_RAZORPAY_KEY_ID
  - VITE_SOCKET_URL
  - VITE_GOOGLE_MAPS_EMBED_KEY

## Routing Overview (Frontend/src/App.jsx)
- Guest-only: /login, /signup, /forgot-password
- Public: /reset-password/:token
- Customer (role: user): /, /restaurant/:id, /restaurants, /cart, /checkout, /orders, /track/:orderId, /profile
- Owner (role: owner): /owner, /owner/shop, /owner/menu, /owner/orders, /owner/profile
- Delivery (role: delivery_boy): /delivery, /delivery/profile
- Admin (role: admin): /admin, /admin/users, /admin/shops, /admin/profile
- Fallback: * -> NotFoundPage

## Layouts (Route Wrappers)

### CustomerLayout
File: Frontend/src/layouts/CustomerLayout.jsx
Purpose: Shared customer shell with top nav, mobile bottom nav, and cart FAB.
Logic:
- Reads auth state and cart count; shows active nav state and badge counts.
- Signs out via auth slice and redirects to /login.
- Responsive behaviors for desktop vs mobile nav.
Child components (hierarchy):
- Outlet (renders customer pages)

### OwnerLayout
File: Frontend/src/layouts/OwnerLayout.jsx
Purpose: Owner portal shell with sidebar and shop status toggle.
Logic:
- Fetches owner shop and stores it in local state.
- Toggles shop open/closed with backend call.
- Provides shop context to nested pages via Outlet context.
Child components (hierarchy):
- Sidebar (local component)
  - Navigation links
  - Shop live toggle
- Outlet (renders owner pages)

### DeliveryLayout
File: Frontend/src/layouts/DeliveryLayout.jsx
Purpose: Delivery portal shell with slim header and responsive full-height map area.
Logic:
- Sign out from header.
- Adjusts layout height/scroll based on dashboard vs sub-pages.
Child components (hierarchy):
- Outlet (renders delivery pages)

### AdminLayout
File: Frontend/src/layouts/AdminLayout.jsx
Purpose: Admin shell with left sidebar, mobile drawer, and top header.
Logic:
- Highlights active section via location.
- Sign out from sidebar.
- Handles mobile open/close state.
Child components (hierarchy):
- Outlet (renders admin pages)

### PublicLayout
File: Frontend/src/layouts/PublicLayout.jsx
Purpose: Simple pass-through layout for public routes.
Logic:
- Renders Outlet only.
Child components (hierarchy):
- Outlet

## Pages (By Portal)

### Auth: LoginPage
Path: /login (GuestRoute)
File: Frontend/src/pages/auth/LoginPage.jsx
Description: Email/password sign-in with demo quick-fill buttons.
Logic:
- Local form state with validation and error display.
- Dispatches signIn and redirects by role on success.
- Clears auth error on submit.
Child components (hierarchy):
- AuthLayout
  - InputField (email)
  - InputField (password with show/hide)
  - Button

### Auth: SignupPage
Path: /signup (GuestRoute)
File: Frontend/src/pages/auth/SignupPage.jsx
Description: Account creation with role selection and password strength meter.
Logic:
- Role selection for user, owner, delivery agent.
- Validates fields and password strength.
- Dispatches signUp and auto signIn for customer flow.
- Shows admin-approval notice for owner and delivery roles.
Child components (hierarchy):
- AuthLayout
  - RoleCard (role selector)
  - InputField (name, email, phone, password)
  - Button

### Auth: ForgotPasswordPage
Path: /forgot-password (GuestRoute)
File: Frontend/src/pages/auth/ForgotPasswordPage.jsx
Description: Password reset request form with success state.
Logic:
- Validates email and POSTs /auth/forgot-password.
- Shows success instructions if email sent.
Child components (hierarchy):
- AuthLayout
  - InputField (email)
  - Button

### Auth: ResetPasswordPage
Path: /reset-password/:token (Public)
File: Frontend/src/pages/auth/ResetPasswordPage.jsx
Description: Reset password form with validation and success state.
Logic:
- Validates strong password and confirmation.
- POSTs /auth/reset-password/:token.
- Redirects to login after success.
Child components (hierarchy):
- AuthLayout
  - InputField (new password)
  - InputField (confirm password)
  - Button

### Shared: NotFoundPage
Path: *
File: Frontend/src/pages/NotFoundPage.jsx
Description: 404 page with role-aware "Go Home" redirect.
Logic:
- Simple animation via requestAnimationFrame.
- Redirects by current user role (admin, owner, delivery, user).
Child components (hierarchy):
- None (self-contained)

### Customer: HomePage
Path: /
File: Frontend/src/pages/customer/HomePage.jsx
Description: Customer landing with location chip, search, and shop listings.
Logic:
- Uses geolocation + Nominatim reverse geocode to show city.
- Fetches /shops and filters by search and category.
- Shows skeleton cards while loading.
Child components (hierarchy):
- SkeletonCard (local)
- ShopCard (local)

### Customer: AllRestaurantsPage
Path: /restaurants
File: Frontend/src/pages/customer/AllRestaurantsPage.jsx
Description: Full listing of open restaurants with search and cuisine filters.
Logic:
- Fetches /shops and filters to open + approved shops.
- Client-side search and category filtering.
Child components (hierarchy):
- SkeletonCard (local)
- ShopCard (local)

### Customer: RestaurantPage
Path: /restaurant/:id
File: Frontend/src/pages/customer/RestaurantPage.jsx
Description: Restaurant detail and menu browsing with add-to-cart.
Logic:
- Fetches /shops/:id to load shop and menu.
- Filters menu by category, search, and veg-only toggle.
- Uses cart slice to add items; triggers ClearCartModal when shop changes.
- Supports share and favorite actions (toast + native share/clipboard).
Child components (hierarchy):
- MenuItemCard (local)

### Customer: CartPage
Path: /cart
File: Frontend/src/pages/customer/CartPage.jsx
Description: Cart review with quantities, bill summary, and checkout CTA.
Logic:
- Reads cart slice, calculates totals, delivery fee, and platform fee.
- Allows quantity adjustments and clear cart.
- Navigates to /checkout.
Child components (hierarchy):
- Stepper (local)
- VegDot (local)
- EmptyCart (local)

### Customer: CheckoutPage
Path: /checkout
File: Frontend/src/pages/customer/CheckoutPage.jsx
Description: Address selection, payment choice, and order placement.
Logic:
- Loads addresses from /users/me/addresses.
- Adds, deletes, and updates addresses; requires GPS on selected address.
- Uses geolocation to capture GPS for new or existing addresses.
- Creates order via /orders/checkout with idempotency key.
- COD flow: clears cart and navigates to tracking.
- Online flow: creates payment intent, opens Razorpay, verifies payment, and handles cancel/failure with order cancellation.
- Handles delivery radius errors from backend.
Child components (hierarchy):
- AddressCard (local)
- PaymentOption (local)

### Customer: OrdersPage
Path: /orders
File: Frontend/src/pages/customer/OrdersPage.jsx
Description: Order history with status filtering.
Logic:
- Fetches /orders and filters by active, delivered, or cancelled.
- Shows delivery OTP when present.
Child components (hierarchy):
- OrderSkeleton (local)

### Customer: OrderTrackingPage
Path: /track/:orderId
File: Frontend/src/pages/customer/OrderTrackingPage.jsx
Description: Live order tracking with status timeline, OTP, and map.
Logic:
- Fetches /orders/:orderId and polls every 5 seconds.
- Socket.IO live updates for status and agent location.
- Uses Google Maps embed (or fallback) to show directions.
- Shows cancel reason if order cancelled.
Child components (hierarchy):
- None (self-contained)

### Customer/Admin/Owner/Delivery: ProfilePage
Path: /profile (or /owner/profile, /admin/profile, /delivery/profile)
File: Frontend/src/pages/customer/ProfilePage.jsx
Description: Profile management and password change.
Logic:
- PATCH /users/me to update name and phone.
- POST /users/me/change-password with strong password rules.
- On password change success, logs out user after a delay.
Child components (hierarchy):
- Field (local)
- Card (local)
- Alert (local)

### Delivery: DeliveryDashboard
Path: /delivery
File: Frontend/src/pages/delivery/DeliveryDashboard.jsx
Description: Live delivery console with order pool, active deliveries, and map.
Logic:
- Fetches delivery profile, earnings, pool, and orders.
- Toggles online/offline duty state.
- Accepts and releases orders; verifies customer OTP on delivery.
- Uses geolocation watch + Socket.IO to stream rider location.
- Computes routes via OSRM and renders Leaflet map and polylines.
- Provides map search via Nominatim.
Child components (hierarchy):
- PoolCard (local)
- ActiveCard (local)
- FitBounds (local)
- FlyToLocation (local)

### Admin: AdminDashboard
Path: /admin
File: Frontend/src/pages/admin/AdminDashboard.jsx
Description: Platform overview with KPI cards and recent orders.
Logic:
- Fetches stats from /admin/dashboard, /admin/users, /admin/shops, and /orders.
- Displays revenue and status badges.
Child components (hierarchy):
- None (self-contained)

### Admin: AdminUsersPage
Path: /admin/users
File: Frontend/src/pages/admin/AdminUsersPage.jsx
Description: User management table with approve and block actions.
Logic:
- Fetches /admin/users and filters by role and search.
- Approves owners/delivery agents and blocks/unblocks non-admin users.
Child components (hierarchy):
- None (self-contained)

### Admin: AdminShopsPage
Path: /admin/shops
File: Frontend/src/pages/admin/AdminShopsPage.jsx
Description: Shop approval and suspension management.
Logic:
- Fetches /admin/shops and filters by status/search.
- Approves or suspends shops.
Child components (hierarchy):
- None (self-contained)

### Owner: OwnerDashboard
Path: /owner
File: Frontend/src/pages/owner/OwnerDashboard.jsx
Description: Owner analytics and live order monitoring.
Logic:
- Fetches /shops/owner/me, /orders, and /orders/analytics.
- Accepts orders with prep time and cancels orders.
- Displays KPIs, revenue chart, activity feed, order status donut, and payment split.
Child components (hierarchy):
- KPICard (local)
- OrderCard (local)

### Owner: ShopSetupPage
Path: /owner/shop
File: Frontend/src/pages/owner/ShopSetupPage.jsx
Description: Create and manage restaurant details.
Logic:
- Fetches /shops/owner/me to populate form.
- Creates new shop via POST /shops or updates via PATCH /shops/:id.
- Toggles shop open/closed via /shops/:id/toggle-open.
- Syncs shop state with OwnerLayout via Outlet context.
Child components (hierarchy):
- None (self-contained)

### Owner: MenuPage
Path: /owner/menu
File: Frontend/src/pages/owner/MenuPage.jsx
Description: Menu management with CRUD and availability toggles.
Logic:
- Fetches /shops/owner/me and uses menu items from shop.
- Creates/updates/deletes items via /shops/:id/menu endpoints.
- Toggles stock via /shops/:id/menu/:id/toggle-stock.
Child components (hierarchy):
- MenuItemForm (local)

### Owner: OwnerOrdersPage
Path: /owner/orders
File: Frontend/src/pages/owner/OwnerOrdersPage.jsx
Description: Order queue with status actions and filters.
Logic:
- Fetches /orders and filters active vs history.
- Confirms, marks preparing, marks ready, and cancels orders.
Child components (hierarchy):
- OrderCard (local)

## Global Components Mounted in App
- Frontend/src/components/ui/Toast.jsx: Displays toast notifications from UI slice.
- Frontend/src/components/cart/ClearCartModal.jsx: Confirmation modal when switching restaurants with existing cart items.
