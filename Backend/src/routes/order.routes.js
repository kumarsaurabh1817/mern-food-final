import express from "express";
import { verifyToken, requireRole } from "../middleware/auth.middleware.js";
import {
  checkout,
  getOrders,
  getOrderById,
  getOrderAnalytics,
  confirmOrder,
  markPreparing,
  markReady,
  cancelOrder,
  verifyDeliveryOtp,
} from "../controllers/order.controller.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { checkoutSchema } from "../middleware/schemas.middleware.js";

const router = express.Router();


router.use(verifyToken);

router.post(
  "/checkout",
  requireRole("user"),
  checkoutSchema,
  validateRequest,
  checkout,
);


router.get("/analytics", requireRole("owner", "admin"), getOrderAnalytics);

router.get("/", getOrders);


router.get("/:id", getOrderById);

router.patch("/:id/cancel", cancelOrder);


router.patch("/:id/confirm", requireRole("owner", "admin"), confirmOrder);


router.patch("/:id/preparing", requireRole("owner", "admin"), markPreparing);


router.patch("/:id/ready", requireRole("owner", "admin"), markReady);

router.post(
  "/:id/verify-otp",
  requireRole("delivery_boy", "admin"),
  verifyDeliveryOtp,
);

export default router;
