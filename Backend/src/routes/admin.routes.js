import express from "express";
import { verifyToken, requireRole } from "../middleware/auth.middleware.js";
import {
  getDashboardKpis,
  getUsers,
  approveUser,
  rejectUser,
  toggleBlockUser,
  getShops,
  approveShop,
  toggleSuspendShop,
  getRevenueAnalytics,
} from "../controllers/admin.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only endpoints for platform management
 */

router.use(verifyToken, requireRole("admin"));

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get platform KPIs — GMV, total orders, active users, commission, pending approvals
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard KPI data
 *       403:
 *         description: Forbidden
 */
router.get("/dashboard", getDashboardKpis);

/**
 * @swagger
 * /api/admin/revenue:
 *   get:
 *     tags: [Admin]
 *     summary: Get detailed revenue, commission, and per-shop payout analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue analytics
 *       403:
 *         description: Forbidden
 */
router.get("/revenue", getRevenueAnalytics);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users with optional filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, owner, delivery_boy, admin]
 *         description: Filter by role
 *       - in: query
 *         name: isBlocked
 *         schema:
 *           type: boolean
 *         description: Filter by blocked status
 *       - in: query
 *         name: isApprovedByAdmin
 *         schema:
 *           type: boolean
 *         description: Filter by approval status
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
 *         description: Paginated list of users
 *       403:
 *         description: Forbidden
 */
router.get("/users", getUsers);

/**
 * @swagger
 * /api/admin/users/{id}/approve:
 *   patch:
 *     tags: [Admin]
 *     summary: Approve a KYC application (owner or delivery boy)
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
 *         description: User approved — welcome email sent
 *       400:
 *         description: Only owners/delivery boys require approval
 *       404:
 *         description: User not found
 */
router.patch("/users/:id/approve", approveUser);

/**
 * @swagger
 * /api/admin/users/{id}/reject:
 *   patch:
 *     tags: [Admin]
 *     summary: Reject a KYC application with a reason
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
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Documents unclear or incomplete.
 *     responses:
 *       200:
 *         description: KYC rejected — notification sent
 *       400:
 *         description: Reason is required
 *       404:
 *         description: User not found
 */
router.patch("/users/:id/reject", rejectUser);

/**
 * @swagger
 * /api/admin/users/{id}/block:
 *   patch:
 *     tags: [Admin]
 *     summary: Block or unblock a user account
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
 *         description: User block status toggled
 *       400:
 *         description: Cannot block an admin account
 *       404:
 *         description: User not found
 */
router.patch("/users/:id/block", toggleBlockUser);

/**
 * @swagger
 * /api/admin/shops:
 *   get:
 *     tags: [Admin]
 *     summary: List all shops with optional approval filter
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isApproved
 *         schema:
 *           type: boolean
 *         description: Filter by approval status
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
 *         description: Paginated list of shops
 *       403:
 *         description: Forbidden
 */
router.get("/shops", getShops);

/**
 * @swagger
 * /api/admin/shops/{id}/approve:
 *   patch:
 *     tags: [Admin]
 *     summary: Approve a shop for public listing
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
 *         description: Shop approved and listed
 *       404:
 *         description: Shop not found
 */
router.patch("/shops/:id/approve", approveShop);

/**
 * @swagger
 * /api/admin/shops/{id}/suspend:
 *   patch:
 *     tags: [Admin]
 *     summary: Suspend or reinstate a shop
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
 *         description: Shop suspended or reinstated
 *       404:
 *         description: Shop not found
 */
router.patch("/shops/:id/suspend", toggleSuspendShop);

export default router;
