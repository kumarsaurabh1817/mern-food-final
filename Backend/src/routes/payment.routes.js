import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  createPaymentIntent,
  verifyPayment,
} from "../controllers/payment.controller.js";

const router = express.Router();

// All payment routes require authentication
router.use(verifyToken);

router.post("/create-intent", createPaymentIntent);
router.post("/verify", verifyPayment);

export default router;
