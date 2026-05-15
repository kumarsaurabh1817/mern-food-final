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

/**
 * @swagger
 * tags:
 *   name: Shops
 *   description: Shop browsing (public/user) and shop management (owner/admin)
 */

// -- Public / General User Routes --

/**
 * @swagger
 * /api/shops:
 *   get:
 *     tags: [Shops]
 *     summary: Get a list of all approved and open shops
 *     parameters:
 *       - in: query
 *         name: cuisine
 *         schema:
 *           type: string
 *         description: Filter by cuisine type
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         description: Latitude for proximity sorting
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         description: Longitude for proximity sorting
 *     responses:
 *       200:
 *         description: List of shops
 *       401:
 *         description: Unauthorized
 */
router.get("/", getShops);

/**
 * @swagger
 * /api/shops/search:
 *   get:
 *     tags: [Shops]
 *     summary: Search shops by name or cuisine
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query string
 *     responses:
 *       200:
 *         description: Matching shops
 *       401:
 *         description: Unauthorized
 */
router.get("/search", searchShops);

/**
 * @swagger
 * /api/shops/{id}:
 *   get:
 *     tags: [Shops]
 *     summary: Get a single shop by ID (includes menu)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Shop details with menu
 *       404:
 *         description: Shop not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", getShopById);

// -- Owner Routes --
router.use(verifyToken, requireRole('owner', 'admin'));

/**
 * @swagger
 * /api/shops/owner/me:
 *   get:
 *     tags: [Shops]
 *     summary: Get the shop owned by the currently authenticated owner
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Owner's shop
 *       404:
 *         description: Shop not found for this owner
 *       401:
 *         description: Unauthorized
 */
router.get("/owner/me", getMyShop);

/**
 * @swagger
 * /api/shops:
 *   post:
 *     tags: [Shops]
 *     summary: Create a new shop (owner only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, cuisine, address]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Spice Garden
 *               description:
 *                 type: string
 *                 example: Authentic Indian cuisine
 *               cuisine:
 *                 type: string
 *                 example: Indian
 *               address:
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
 *               estimatedDeliveryTime:
 *                 type: number
 *                 example: 30
 *               deliveryFee:
 *                 type: number
 *                 example: 30
 *               minOrderAmount:
 *                 type: number
 *                 example: 100
 *     responses:
 *       201:
 *         description: Shop created
 *       401:
 *         description: Unauthorized
 */
router.post("/", createShop);

/**
 * @swagger
 * /api/shops/{id}:
 *   patch:
 *     tags: [Shops]
 *     summary: Update shop details (owner/admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               estimatedDeliveryTime:
 *                 type: number
 *               deliveryFee:
 *                 type: number
 *               minOrderAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Shop updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shop not found
 *   delete:
 *     tags: [Shops]
 *     summary: Delete a shop (owner/admin)
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
 *         description: Shop deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shop not found
 */
router.patch("/:id", updateShop);
router.delete("/:id", deleteShop);

/**
 * @swagger
 * /api/shops/{id}/toggle-open:
 *   patch:
 *     tags: [Shops]
 *     summary: Toggle shop open/closed status
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
 *         description: Shop status toggled
 *       403:
 *         description: Forbidden
 */
router.patch("/:id/toggle-open", toggleShopOpen);

/**
 * @swagger
 * /api/shops/{id}/menu:
 *   post:
 *     tags: [Shops]
 *     summary: Add a new menu item to a shop
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, category]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Butter Chicken
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 example: 250
 *               category:
 *                 type: string
 *                 example: Main Course
 *               isVeg:
 *                 type: boolean
 *                 example: false
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Menu item added
 *       403:
 *         description: Forbidden
 */
router.post("/:id/menu", addMenuItem);

/**
 * @swagger
 * /api/shops/{id}/menu/{itemId}:
 *   patch:
 *     tags: [Shops]
 *     summary: Update a menu item
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               isVeg:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Menu item updated
 *       404:
 *         description: Item not found
 *   delete:
 *     tags: [Shops]
 *     summary: Delete a menu item
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Menu item deleted
 *       404:
 *         description: Item not found
 */
router.patch("/:id/menu/:itemId", updateMenuItem);
router.delete("/:id/menu/:itemId", deleteMenuItem);

/**
 * @swagger
 * /api/shops/{id}/menu/{itemId}/toggle-stock:
 *   patch:
 *     tags: [Shops]
 *     summary: Toggle a menu item's in-stock status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stock status toggled
 *       404:
 *         description: Item not found
 */
router.patch("/:id/menu/:itemId/toggle-stock", toggleItemStock);

export default router;
