import express from "express";
import { verifyToken, requireRole } from "../middleware/auth.middleware.js";
import {
  getMyProfile,
  toggleDuty,
  getPool,
  acceptOrder,
  rejectOrder,
  releaseOrder,
  getEarnings,
} from "../controllers/delivery.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Delivery
 *   description: Delivery boy profile, duty management, and order pool
 */

// All delivery routes require 'delivery_boy' or 'admin' role
router.use(verifyToken, requireRole("delivery_boy", "admin"));

/**
 * @swagger
 * /api/delivery/me:
 *   get:
 *     tags: [Delivery]
 *     summary: Get the delivery boy's own profile and current status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Delivery agent profile
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — not a delivery boy
 */
router.get("/me", getMyProfile);

/**
 * @swagger
 * /api/delivery/toggle-duty:
 *   patch:
 *     tags: [Delivery]
 *     summary: Toggle the delivery boy's on-duty / off-duty status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Duty status toggled
 *       401:
 *         description: Unauthorized
 */
router.patch("/toggle-duty", toggleDuty);

/**
 * @swagger
 * /api/delivery/pool:
 *   get:
 *     tags: [Delivery]
 *     summary: Get the pool of ready orders available for pickup
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders available for delivery
 *       401:
 *         description: Unauthorized
 */
router.get("/pool", getPool);

/**
 * @swagger
 * /api/delivery/accept/{orderId}:
 *   post:
 *     tags: [Delivery]
 *     summary: Accept an order from the delivery pool
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Order accepted and assigned to this delivery agent
 *       400:
 *         description: Order no longer available
 *       401:
 *         description: Unauthorized
 */
router.post("/accept/:orderId", acceptOrder);

/**
 * @swagger
 * /api/delivery/reject/{orderId}:
 *   post:
 *     tags: [Delivery]
 *     summary: Reject an order from the delivery pool
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order rejected
 *       401:
 *         description: Unauthorized
 */
router.post("/reject/:orderId", rejectOrder);

/**
 * @swagger
 * /api/delivery/earnings:
 *   get:
 *     tags: [Delivery]
 *     summary: Get the delivery boy's earnings summary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Earnings data
 *       401:
 *         description: Unauthorized
 */
router.get("/earnings", getEarnings);

/**
 * @swagger
 * /api/delivery/release/{orderId}:
 *   post:
 *     tags: [Delivery]
 *     summary: Release (un-accept) an order back to the delivery pool
 *     description: Allows the assigned delivery agent to abandon an accepted order. The order is unassigned and returned to the pool so another agent can pick it up. If the order was already out_for_delivery, it reverts to 'preparing'.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Order released back to the delivery pool
 *       400:
 *         description: Order already delivered or cancelled
 *       404:
 *         description: Order not found or agent not assigned
 *       401:
 *         description: Unauthorized
 */
router.post("/release/:orderId", releaseOrder);

export default router;
