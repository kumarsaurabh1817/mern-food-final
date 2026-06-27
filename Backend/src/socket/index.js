import { Server } from "socket.io";
import { verifyAccessToken } from "../utils/token.utils.js";

let io;

// ── In-memory last-known-location cache ─────────────────────────────────────
// Stores { lat, lng, ts } per orderId so late-joining customers immediately
// receive the agent's position without waiting for the next watchPosition tick.
// This is process-local memory — good enough for single-server deployments.
// For multi-instance setups, replace with Redis pub/sub.
const agentLocationCache = new Map();

export const initSocket = (server) => {
    // B7 FIX: Mirror the same allowed origins as the HTTP server in app.js.
    const allowedOrigins = [
        process.env.CLIENT_URL || "http://localhost:5173",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "https://localhost:5173",
        "https://localhost:5174",
        "https://127.0.0.1:5173",
    ];

    io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            credentials: true,
            methods: ["GET", "POST", "PATCH"]
        }
    });

    // ── Auth middleware — allow connections with or without a token ────────────
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            socket.user = null;
            return next();
        }
        try {
            socket.user = verifyAccessToken(token);
            next();
        } catch {
            // Expired/invalid token — still allow through so order room works
            socket.user = null;
            next();
        }
    });

    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // ── Customer / owner joins a specific order room ─────────────────────
        socket.on("joinOrderRoom", (payload) => {
            // Accept both plain string and { orderId } object from the client
            const orderId = typeof payload === "string" ? payload : payload?.orderId;
            if (!orderId) return;

            socket.join(`order_${orderId}`);
            console.log(`Socket ${socket.id} joined room order_${orderId}`);

            // ── Replay last known location immediately so late-joining customers
            //    don't have to wait for the next watchPosition tick from the agent.
            const cached = agentLocationCache.get(orderId);
            if (cached) {
                socket.emit("agentLocationUpdated", { lat: cached.lat, lng: cached.lng });
                console.log(`[Socket] Replayed cached location for order ${orderId} to ${socket.id}`);
            }
        });

        socket.on("joinOwnerRoom", (ownerId) => {
            socket.join(`owner_${ownerId}`);
            console.log(`Socket ${socket.id} joined room owner_${ownerId}`);
        });

        // ── Admin joins the global feed of every order event (platform-wide) ──
        socket.on("joinAdminRoom", () => {
            if (socket.user?.role !== "admin") return;
            socket.join("admins");
            console.log(`Socket ${socket.id} joined room admins`);
        });

        // ── Customer joins their personal room for live order-list updates ───
        // Accepts a plain id or { userId }. Falls back to the authenticated user.
        socket.on("joinUserRoom", (payload) => {
            const userId =
                (typeof payload === "string" ? payload : payload?.userId) ||
                socket.user?.id;
            if (!userId) return;
            socket.join(`user_${userId}`);
            console.log(`Socket ${socket.id} joined room user_${userId}`);
        });

        // ── Delivery agent joins the shared pool + their personal room ───────
        // Only authenticated delivery agents may subscribe to the pool feed.
        socket.on("joinDeliveryPool", () => {
            if (socket.user?.role !== "delivery_boy" || !socket.user?.id) return;
            socket.join("delivery_pool");
            socket.join(`delivery_${socket.user.id}`);
            console.log(`Socket ${socket.id} joined delivery_pool + delivery_${socket.user.id}`);
        });

        socket.on("leaveDeliveryPool", () => {
            socket.leave("delivery_pool");
        });

        // ── Delivery agent pushes their location ─────────────────────────────
        socket.on("updateLocation", (data) => {
            // Per-socket throttle: at most 1 broadcast every 500 ms
            const now = Date.now();
            if (socket._lastLocationUpdate && now - socket._lastLocationUpdate < 500) return;
            socket._lastLocationUpdate = now;

            // Validate coordinates before broadcasting
            const lat = Number(data?.lat);
            const lng = Number(data?.lng);
            if (!data?.orderId || !Number.isFinite(lat) || !Number.isFinite(lng)) {
                console.warn(`[Socket] Invalid updateLocation payload from ${socket.id}:`, data);
                return;
            }

            // Cache this location so late-joining customers get it immediately
            agentLocationCache.set(data.orderId, { lat, lng, ts: now });

            // Broadcast to everyone tracking this order (customer + admin)
            io.to(`order_${data.orderId}`).emit("agentLocationUpdated", { lat, lng });
        });

        // ── Customer requests a location snapshot (pull, not just push) ──────
        // Useful when the customer refreshes and geolocation hasn't ticked yet.
        socket.on("requestAgentLocation", (payload) => {
            const orderId = typeof payload === "string" ? payload : payload?.orderId;
            if (!orderId) return;
            const cached = agentLocationCache.get(orderId);
            if (cached) {
                socket.emit("agentLocationUpdated", { lat: cached.lat, lng: cached.lng });
            }
        });

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
};

/**
 * Remove a delivered/cancelled order's location from the in-process cache.
 * Call this in order.controller after status becomes 'delivered' or 'cancelled'.
 */
export const deleteAgentLocationCache = (orderId) => {
    if (orderId) agentLocationCache.delete(String(orderId));
};

// ── Real-time order broadcast helpers ───────────────────────────────────────
// A single, consistent path every controller uses so customer, owner and the
// assigned delivery agent always stay in sync. All helpers are best-effort:
// they swallow errors so a socket hiccup never breaks the HTTP response.

/**
 * Build a compact, client-safe snapshot of an order for socket payloads.
 * Strips secret OTP fields. Accepts a Mongoose doc or a plain object.
 */
const toOrderPayload = (order) => {
    const o = typeof order?.toObject === "function" ? order.toObject() : { ...order };
    delete o.deliveryOTP;
    delete o.deliveryOTPHash;
    return o;
};

/**
 * Broadcast an order status/data change to everyone who cares:
 *   - order_<id>      : the customer tracking page + anyone watching this order
 *   - user_<customer> : the customer's order-list page
 *   - owner_<ownerId> : the shop owner's orders dashboard (when ownerId known)
 *   - delivery_<agent>: the assigned delivery agent (when one is assigned)
 *
 * Emits the unified `order:update` event plus the legacy event names the older
 * frontend listeners still use, so nothing regresses during migration.
 */
export const emitOrderUpdate = (order, { ownerId } = {}) => {
    if (!order?._id) return;
    try {
        const io = getIO();
        const orderId = String(order._id);
        const payload = {
            orderId,
            status: order.status,
            order: toOrderPayload(order),
        };

        const emitBoth = (room) => {
            io.to(room).emit("order:update", payload);
            // Legacy events kept for backward compatibility
            io.to(room).emit("order:status", { orderId, status: order.status });
            io.to(room).emit("orderStatusUpdated", { orderId, status: order.status });
        };

        emitBoth(`order_${orderId}`);
        if (order.customer) emitBoth(`user_${order.customer}`);
        if (ownerId) emitBoth(`owner_${ownerId}`);
        if (order.deliveryAgent) emitBoth(`delivery_${order.deliveryAgent}`);
        // Platform-wide admin feed
        io.to("admins").emit("order:update", payload);
    } catch (_) {
        /* socket not critical — HTTP response already sent */
    }
};

/**
 * Notify a shop owner that a brand-new order just landed.
 * Emits both the unified `order:new` and the legacy `newOrder` event.
 */
export const emitNewOrder = (order, ownerId) => {
    if (!order?._id || !ownerId) return;
    try {
        const io = getIO();
        const payload = { orderId: String(order._id), order: toOrderPayload(order) };
        io.to(`owner_${ownerId}`).emit("order:new", payload);
        io.to(`owner_${ownerId}`).emit("newOrder", payload);
        // Platform-wide admin feed
        io.to("admins").emit("order:new", payload);
    } catch (_) {
        /* best-effort */
    }
};

/**
 * Tell every online delivery agent that an order just became available
 * (ready_for_pickup with no agent). They can insert it into their pool live.
 */
export const emitPoolAdd = (order) => {
    if (!order?._id) return;
    try {
        const io = getIO();
        io.to("delivery_pool").emit("pool:add", {
            orderId: String(order._id),
            order: toOrderPayload(order),
        });
    } catch (_) {
        /* best-effort */
    }
};

/**
 * Tell every online delivery agent to remove an order from their pool
 * (it was accepted, cancelled, or otherwise no longer available).
 */
export const emitPoolRemove = (orderId) => {
    if (!orderId) return;
    try {
        const io = getIO();
        io.to("delivery_pool").emit("pool:remove", { orderId: String(orderId) });
    } catch (_) {
        /* best-effort */
    }
};
