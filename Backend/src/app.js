import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import shopRoutes from "./routes/shop.routes.js";
import orderRoutes from "./routes/order.routes.js";
import deliveryRoutes from "./routes/delivery.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";

import { errorHandler } from "./middleware/error.middleware.js";
import "./utils/cron.js";

const app = express();

// Security headers
app.use(helmet());

app.use(cors({
  origin: [process.env.CLIENT_URL || "http://localhost:5173"],
  credentials: true,
}));

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Webhook route — must come BEFORE express.json()
// Razorpay sends raw binary data; we capture it in req.rawBody for HMAC signature verification,
// then also parse it to req.body so the controller can read the event payload
app.use("/webhooks", express.raw({ type: "application/json" }), (req, res, next) => {
  req.rawBody = req.body;
  try {
    req.body = JSON.parse(req.rawBody.toString("utf8"));
  } catch {
    req.body = {};
  }
  next();
});
app.use("/webhooks", webhookRoutes);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({ message: "OrangeBite backend is running" });
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/shops", shopRoutes);
app.use("/orders", orderRoutes);
app.use("/delivery", deliveryRoutes);
app.use("/admin", adminRoutes);
app.use("/payments", paymentRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route does not exist", errors: [] });
});

app.use(errorHandler);

export default app;
