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

router.post("/setup-admin", setupAdmin);

router.post(
  "/signup",
  signupRateLimiter,
  signupSchema,
  validateRequest,
  signup,
);

router.post("/login", loginRateLimiter, loginSchema, validateRequest, login);

router.post("/logout", verifyToken, logout);

router.post("/refresh", refresh);

router.get("/verify-email/:token", verifyEmail);

router.post(
  "/forgot-password",
  forgotPasswordRateLimiter,
  forgotPasswordSchema,
  validateRequest,
  forgotPassword,
);

router.post(
  "/reset-password/:token",
  resetPasswordSchema,
  validateRequest,
  resetPassword,
);

export default router;
