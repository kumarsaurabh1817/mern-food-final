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

// All routes require authentication
router.use(verifyToken);

// ─── Profile ──────────────────────────────────────────────────────────────────
router.get("/me", getOwnProfile);
router.patch("/me", updateOwnProfile);

// ─── Addresses ────────────────────────────────────────────────────────────────
router.get("/me/addresses", getAddresses);
router.post("/me/addresses", addAddress);
router.patch("/me/addresses/:id", updateAddress);
router.delete("/me/addresses/:id", removeAddress);

// ─── Security ─────────────────────────────────────────────────────────────────
router.post("/me/change-password", changePassword);

export default router;
