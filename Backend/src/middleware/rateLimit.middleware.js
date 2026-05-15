import rateLimit from "express-rate-limit";

// S5 FIX: Restored to production-safe values.
// Was: windowMs:60s, max:1000 (effectively disabled for "testing").
// Env override RATE_LIMIT_MAX_LOGIN lets you raise the cap locally without
// touching this file — set it in .env.local during development.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: parseInt(process.env.RATE_LIMIT_MAX_LOGIN, 10) || 10,
  message: {
    success: false,
    message:
      "Too many login attempts from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Signup: 5 new accounts per hour per IP (prevents registration spam)
export const signupRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message:
      "Too many accounts created from this IP, please try again after an hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Forgot-password: 5 requests per hour per IP (prevents email bombing)
export const forgotPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many password reset requests, please try again after an hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
