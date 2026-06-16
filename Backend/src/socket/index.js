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
