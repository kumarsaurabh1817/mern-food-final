import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  createPaymentIntent,
  verifyPayment,
} from "../controllers/payment.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Razorpay payment intent creation and verification
 */

router.use(verifyToken);

/**
 * @swagger
 * /api/payments/create-intent:
 *   post:
 *     tags: [Payments]
 *     summary: Create a Razorpay order for an app order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: The MongoDB ObjectId of the order to pay for
 *                 example: 6640a1b2c3d4e5f678901234
 *     responses:
 *       200:
 *         description: Razorpay order created — returns orderId, amount, currency
 *       400:
 *         description: Invalid order or already paid
 *       401:
 *         description: Unauthorized
 */
router.post("/create-intent", createPaymentIntent);

/**
 * @swagger
 * /api/payments/verify:
 *   post:
 *     tags: [Payments]
 *     summary: Verify a completed Razorpay payment and update order status
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature]
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: 6640a1b2c3d4e5f678901234
 *               razorpay_order_id:
 *                 type: string
 *                 description: Razorpay order ID (e.g. order_xyz)
 *               razorpay_payment_id:
 *                 type: string
 *                 description: Payment ID from Razorpay callback
 *               razorpay_signature:
 *                 type: string
 *                 description: HMAC-SHA256 signature for verification
 *     responses:
 *       200:
 *         description: Payment verified — order status updated to confirmed
 *       400:
 *         description: Payment verification failed or signature mismatch
 *       401:
 *         description: Unauthorized
 */
router.post("/verify", verifyPayment);

export default router;
