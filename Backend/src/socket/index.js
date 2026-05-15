import { Server } from "socket.io";
import { verifyAccessToken } from "../utils/token.utils.js";

let io;

export const initSocket = (server) => {
    // B7 FIX: Mirror the same allowed origins as the HTTP server in app.js.
    // Previously only CLIENT_URL (one origin) was allowed, breaking WebSocket
    // connections when the frontend ran on a different port (e.g. 5174).
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

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        try {
            socket.user = verifyAccessToken(token);
            next();
        } catch { next(new Error("Unauthorized")); }
    });

    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on("joinOrderRoom", (orderId) => {
            socket.join(`order_${orderId}`);
            console.log(`Socket ${socket.id} joined room order_${orderId}`);
        });

        socket.on("joinOwnerRoom", (ownerId) => {
            socket.join(`owner_${ownerId}`);
            console.log(`Socket ${socket.id} joined room owner_${ownerId}`);
        });

        socket.on("updateLocation", (data) => {
            // Per-socket throttle: allow at most 1 update every 500ms
            const now = Date.now();
            if (socket._lastLocationUpdate && now - socket._lastLocationUpdate < 500) return;
            socket._lastLocationUpdate = now;

            // Validate incoming coordinates before broadcasting
            const lat = Number(data?.lat);
            const lng = Number(data?.lng);
            if (!data?.orderId || !Number.isFinite(lat) || !Number.isFinite(lng)) {
                console.warn(`[Socket] Invalid updateLocation payload from ${socket.id}:`, data);
                return;
            }
            io.to(`order_${data.orderId}`).emit("agentLocationUpdated", { lat, lng });
        });

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
