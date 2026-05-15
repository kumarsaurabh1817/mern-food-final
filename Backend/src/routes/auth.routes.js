import express from "express";
import {
  signup,
  login,
  logout,
  refresh,
  verifyEmail,
  forgotPassword,
  resetPassword,
  setupAdmin,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  loginRateLimiter,
  signupRateLimiter,
  forgotPasswordRateLimiter,
} from "../middleware/rateLimit.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../middleware/schemas.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and authorization endpoints
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Creates a new account. Owners and delivery boys must verify their email before logging in.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: Pass@1234
 *               role:
 *                 type: string
 *                 enum: [user, owner, delivery_boy]
 *                 example: user
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Validation error or email already in use
 */
// One-time admin bootstrap — self-seals after first admin is created
router.post("/setup-admin", setupAdmin);

router.post(
  "/signup",
  signupRateLimiter,
  signupSchema,
  validateRequest,
  signup,
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: Pass@1234
 *     responses:
 *       200:
 *         description: Login successful — returns accessToken and sets refreshToken cookie
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account locked, blocked, or pending verification/approval
 */
router.post("/login", loginRateLimiter, loginSchema, validateRequest, login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/logout", verifyToken, logout);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh the access token using the refreshToken cookie
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         description: Refresh token not found
 *       403:
 *         description: Refresh token expired or invalid
 */
router.post("/refresh", refresh);

/**
 * @swagger
 * /api/auth/verify-email/{token}:
 *   get:
 *     tags: [Auth]
 *     summary: Verify a user's email address
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token sent to the user's inbox
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.get("/verify-email/:token", verifyEmail);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset link
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: If an account exists, a reset link has been sent
 */
router.post(
  "/forgot-password",
  forgotPasswordRateLimiter,
  forgotPasswordSchema,
  validateRequest,
  forgotPassword,
);

/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   post:
 *     tags: [Auth]
 *     summary: Reset a user's password using a reset token
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token from the email link
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: NewPass@5678
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired reset token
 */
router.post(
  "/reset-password/:token",
  resetPasswordSchema,
  validateRequest,
  resetPassword,
);

export default router;
