import express from "express";
import { handleRazorpayWebhook } from "../controllers/payment.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Webhooks
 *   description: Payment gateway webhook receivers (called by Razorpay, not by clients)
 */

/**
 * @swagger
 * /api/webhooks/razorpay:
 *   post:
 *     tags: [Webhooks]
 *     summary: Razorpay webhook receiver
 *     description: >
 *       Called by Razorpay to notify of payment events (e.g. payment.captured, order.paid).
 *       Requires a valid `x-razorpay-signature` header.
 *       **Do not call this endpoint manually — it is for Razorpay only.**
 *     parameters:
 *       - in: header
 *         name: x-razorpay-signature
 *         required: true
 *         schema:
 *           type: string
 *         description: Razorpay HMAC-SHA256 signature
 *     responses:
 *       200:
 *         description: Webhook processed
 *       400:
 *         description: Invalid signature or payload
 */
router.post("/razorpay", express.json(), handleRazorpayWebhook);

export default router;
