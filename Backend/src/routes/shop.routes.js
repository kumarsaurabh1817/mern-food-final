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

// ─── Public Routes ────────────────────────────────────────────────────────────
router.get("/", getShops);
router.get("/search", searchShops);
router.get("/:id", getShopById);

// ─── Owner / Admin Routes ─────────────────────────────────────────────────────
// Must be registered BEFORE /:id to avoid route shadowing
router.get("/owner/me", verifyToken, requireRole("owner", "admin"), getMyShop);

router.post("/", verifyToken, requireRole("owner", "admin"), createShop);
router.patch("/:id", verifyToken, requireRole("owner", "admin"), updateShop);
router.delete("/:id", verifyToken, requireRole("owner", "admin"), deleteShop);

router.patch("/:id/toggle-open", verifyToken, requireRole("owner", "admin"), toggleShopOpen);

// ─── Menu Management ──────────────────────────────────────────────────────────
router.post("/:id/menu", verifyToken, requireRole("owner", "admin"), addMenuItem);
router.patch("/:id/menu/:itemId", verifyToken, requireRole("owner", "admin"), updateMenuItem);
router.delete("/:id/menu/:itemId", verifyToken, requireRole("owner", "admin"), deleteMenuItem);
router.patch("/:id/menu/:itemId/toggle-stock", verifyToken, requireRole("owner", "admin"), toggleItemStock);

export default router;
