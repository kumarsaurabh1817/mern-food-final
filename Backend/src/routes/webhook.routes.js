import express from "express";
import { handleRazorpayWebhook } from "../controllers/payment.controller.js";

const router = express.Router();

// Called by Razorpay — not intended for direct client use.
// Body is pre-parsed as raw Buffer in app.js before this route is hit.
router.post("/razorpay", express.json(), handleRazorpayWebhook);

export default router;
