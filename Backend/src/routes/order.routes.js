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

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order placement, tracking, and lifecycle management
 */

router.use(verifyToken);

/**
 * @swagger
 * /api/orders/checkout:
 *   post:
 *     tags: [Orders]
 *     summary: Place a new order (checkout)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shopId, items, deliveryAddress]
 *             properties:
 *               shopId:
 *                 type: string
 *                 example: 6640a1b2c3d4e5f678901234
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     menuItemId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *               deliveryAddress:
 *                 type: object
 *                 properties:
 *                   addressLine1:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [cod, online]
 *                 example: cod
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order placed successfully
 *       400:
 *         description: Validation error or shop unavailable
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/checkout",
  requireRole("user"),
  checkoutSchema,
  validateRequest,
  checkout,
);

/**
 * @swagger
 * /api/orders/analytics:
 *   get:
 *     tags: [Orders]
 *     summary: Get order analytics for a shop (owner/admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: shopId
 *         schema:
 *           type: string
 *         description: Shop ID to fetch analytics for
 *     responses:
 *       200:
 *         description: Order analytics data
 *       403:
 *         description: Forbidden
 */
router.get("/analytics", requireRole("owner", "admin"), getOrderAnalytics);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get orders for the current user (or all orders for admin/owner)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, preparing, ready, out_for_delivery, delivered, cancelled]
 *         description: Filter by order status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *     responses:
 *       200:
 *         description: List of orders
 *       401:
 *         description: Unauthorized
 */
router.get("/", getOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get a single order by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", getOrderById);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   patch:
 *     tags: [Orders]
 *     summary: Cancel an order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order cancelled
 *       400:
 *         description: Cannot cancel at current status
 *       401:
 *         description: Unauthorized
 */
router.patch("/:id/cancel", cancelOrder);

/**
 * @swagger
 * /api/orders/{id}/confirm:
 *   patch:
 *     tags: [Orders]
 *     summary: Confirm an order (owner/admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order confirmed
 *       403:
 *         description: Forbidden
 */
router.patch("/:id/confirm", requireRole("owner", "admin"), confirmOrder);

/**
 * @swagger
 * /api/orders/{id}/preparing:
 *   patch:
 *     tags: [Orders]
 *     summary: Mark order as being prepared (owner/admin only)
 *     description: Moves status from 'confirmed' → 'preparing'. Call this after accepting the order.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order marked as preparing
 *       400:
 *         description: Order is not in confirmed state
 *       403:
 *         description: Forbidden
 */
router.patch("/:id/preparing", requireRole("owner", "admin"), markPreparing);

/**
 * @swagger
 * /api/orders/{id}/ready:
 *   patch:
 *     tags: [Orders]
 *     summary: Mark order as ready for pickup (owner/admin only)
 *     description: Moves status from 'preparing' → 'out_for_delivery'.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order marked ready
 *       400:
 *         description: Order is not in preparing state
 *       403:
 *         description: Forbidden
 */
router.patch("/:id/ready", requireRole("owner", "admin"), markReady);

/**
 * @swagger
 * /api/orders/{id}/verify-otp:
 *   post:
 *     tags: [Orders]
 *     summary: Verify delivery OTP to mark order as delivered (delivery boy/admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [otp]
 *             properties:
 *               otp:
 *                 type: string
 *                 example: "482931"
 *     responses:
 *       200:
 *         description: OTP verified, order marked delivered
 *       400:
 *         description: Invalid or expired OTP
 *       403:
 *         description: Forbidden
 */
router.post(
  "/:id/verify-otp",
  requireRole("delivery_boy", "admin"),
  verifyDeliveryOtp,
);

export default router;
