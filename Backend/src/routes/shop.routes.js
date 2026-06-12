import express from "express";
import { verifyToken, requireRole } from "../middleware/auth.middleware.js";
import {
	getShops,
	searchShops,
	getShopById,
	createShop,
	updateShop,
	deleteShop,
	addMenuItem,
	updateMenuItem,
	deleteMenuItem,
	toggleItemStock,
	toggleShopOpen,
	getMyShop
} from "../controllers/shop.controller.js";

const router = express.Router();

// ── Public / Customer Routes ──────────────────────────────────────────────────

// GET /shops
router.get("/", getShops);

// GET /shops/search?q=...
router.get("/search", searchShops);

// ── Owner/Admin: MUST come BEFORE /:id to avoid wildcard capture ─────────────

// GET /shops/owner/me  ← must be before /:id
router.get("/owner/me", verifyToken, requireRole("owner", "admin"), getMyShop);

// ── Public by ID ─────────────────────────────────────────────────────────────

// GET /shops/:id
router.get("/:id", getShopById);

// ── All routes below require authentication ───────────────────────────────────

// POST /shops
router.post("/", verifyToken, requireRole("owner", "admin"), createShop);

// PATCH /shops/:id
router.patch("/:id", verifyToken, requireRole("owner", "admin"), updateShop);

// DELETE /shops/:id
router.delete("/:id", verifyToken, requireRole("owner", "admin"), deleteShop);

// PATCH /shops/:id/toggle-open
router.patch("/:id/toggle-open", verifyToken, requireRole("owner", "admin"), toggleShopOpen);

// POST /shops/:id/menu
router.post("/:id/menu", verifyToken, requireRole("owner", "admin"), addMenuItem);

// PATCH /shops/:id/menu/:itemId
router.patch("/:id/menu/:itemId", verifyToken, requireRole("owner", "admin"), updateMenuItem);

// DELETE /shops/:id/menu/:itemId
router.delete("/:id/menu/:itemId", verifyToken, requireRole("owner", "admin"), deleteMenuItem);

// PATCH /shops/:id/menu/:itemId/toggle-stock
router.patch("/:id/menu/:itemId/toggle-stock", verifyToken, requireRole("owner", "admin"), toggleItemStock);

export default router;
