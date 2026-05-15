import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  getOwnProfile,
  updateOwnProfile,
  getAddresses,
  addAddress,
  removeAddress,
  updateAddress,
  changePassword,
} from "../controllers/user.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Authenticated user profile and address management
 */

// All routes require authentication
router.use(verifyToken);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get the current user's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile returned
 *       401:
 *         description: Unauthorized
 *   patch:
 *     tags: [Users]
 *     summary: Update the current user's profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Doe
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/me", getOwnProfile);
router.patch("/me", updateOwnProfile);

/**
 * @swagger
 * /api/users/me/addresses:
 *   get:
 *     tags: [Users]
 *     summary: Get all saved addresses of the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of addresses
 *       401:
 *         description: Unauthorized
 *   post:
 *     tags: [Users]
 *     summary: Add a new address for the current user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [label, addressLine1, city, state, zipCode]
 *             properties:
 *               label:
 *                 type: string
 *                 example: Home
 *               addressLine1:
 *                 type: string
 *                 example: 12 Main Street
 *               addressLine2:
 *                 type: string
 *                 example: Apt 3B
 *               city:
 *                 type: string
 *                 example: Mumbai
 *               state:
 *                 type: string
 *                 example: Maharashtra
 *               zipCode:
 *                 type: string
 *                 example: "400001"
 *               lat:
 *                 type: number
 *                 example: 19.076
 *               lng:
 *                 type: number
 *                 example: 72.877
 *     responses:
 *       201:
 *         description: Address added
 *       401:
 *         description: Unauthorized
 */
router.get("/me/addresses", getAddresses);
router.post("/me/addresses", addAddress);

/**
 * @swagger
 * /api/users/me/addresses/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Update a saved address by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address subdocument ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *                 enum: [Home, Work, Other]
 *               street:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Address updated
 *       404:
 *         description: Address not found
 *       401:
 *         description: Unauthorized
 *   delete:
 *     tags: [Users]
 *     summary: Remove a saved address by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address subdocument ID
 *     responses:
 *       200:
 *         description: Address removed
 *       404:
 *         description: Address not found
 *       401:
 *         description: Unauthorized
 */
router.patch("/me/addresses/:id", updateAddress);
router.delete("/me/addresses/:id", removeAddress);

// Change password (requires current password verification)
// Note: verifyToken is already applied to ALL routes in this router via router.use(verifyToken) above
router.post("/me/change-password", changePassword);

export default router;
