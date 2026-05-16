import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import shopRoutes from "./routes/shop.routes.js";
import orderRoutes from "./routes/order.routes.js";
import deliveryRoutes from "./routes/delivery.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import swaggerSpec from "./config/swagger.js";

// Initialize CRON jobs
import "./utils/cron.js";

const app = express();

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: [
      clientUrl,
      // HTTP dev origins
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
      // HTTPS dev origins (Vite basicSsl / ngrok)
      "https://localhost:5173",
      "https://localhost:5174",
      "https://127.0.0.1:5173",
    ],
    credentials: true,
  }),
);

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
// S6 FIX: Capture raw body for Razorpay webhook HMAC verification.
// express.raw() gives us the exact bytes Razorpay signed; we save it to req.rawBody.
// This must come BEFORE express.json() so the body hasn't been parsed yet.
app.use(
  "/webhooks",
  express.raw({ type: "application/json" }),
  (req, _res, next) => {
    // Expose as req.rawBody so the controller can use it for HMAC computation
    req.rawBody = req.body; // express.raw() puts the Buffer here
    // Also parse to an object so the controller can access req.body.event etc.
    try {
      req.body = JSON.parse(req.rawBody.toString("utf8"));
    } catch {
      req.body = {};
    }
    next();
  },
);
app.use("/webhooks", webhookRoutes);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/shops", shopRoutes);
app.use("/orders", orderRoutes);
app.use("/delivery", deliveryRoutes);
app.use("/admin", adminRoutes);
app.use("/payments", paymentRoutes);

/**
 * @swagger
 * /:
 *   get:
 *     tags:
 *       - System
 *     summary: Basic API liveness check
 *     responses:
 *       200:
 *         description: Backend is running
 */
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "OrangeBite backend is running",
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * @swagger
 * /v1/health:
 *   get:
 *     tags:
 *       - System
 *     summary: Versioned API health endpoint
 *     responses:
 *       200:
 *         description: Backend is healthy
 */
app.get("/v1/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "OrangeBite backend is running",
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

app.get("/api-docs.json", (_req, res) => {
  res.status(200).json(swaggerSpec);
});

app.use(
  "/docs",
  (_req, res, next) => {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'",
    );
    next();
  },
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: "OrangeBite API Docs",
  }),
);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    errors: [],
  });
});

app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  // Structured log — always emitted so production errors are never silent.
  // Stack traces are suppressed in production to avoid leaking internals.
  const logPayload = {
    status: statusCode,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  };
  console.error("[APP_ERROR]", JSON.stringify(logPayload));

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
  });
});

export default app;
