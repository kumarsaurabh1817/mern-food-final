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
 *   description: Shop browsing (customers) and shop & menu management (owners/admin)
 */

// Public customer routes

/**
 * @swagger
 * /api/shops:
 *   get:
 *     tags: [Shops]
 *     summary: List all approved, non-suspended shops (paginated)
 *     parameters:
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
 */
router.get("/", getShops);

/**
 * @swagger
 * /api/shops/search:
 *   get:
 *     tags: [Shops]
 *     summary: Search shops and menu items by keyword, veg filter, or max price
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search keyword
 *         example: pizza
 *       - in: query
 *         name: isVeg
 *         schema:
 *           type: boolean
 *         description: Filter by vegetarian status
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum menu item price
 *         example: 200
 *     responses:
 *       200:
 *         description: List of matching shops
 */
router.get("/search", searchShops);

// Owner / admin routes - must come BEFORE /:id

/**
 * @swagger
 * /api/shops/owner/me:
 *   get:
 *     tags: [Shops]
 *     summary: Get the authenticated owner's own shop with full menu
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Owner shop details and menu
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/owner/me", verifyToken, requireRole("owner", "admin"), getMyShop);

/**
 * @swagger
 * /api/shops:
 *   post:
 *     tags: [Shops]
 *     summary: Create a new shop (owner only - one shop per owner)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, address]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Spice Garden
 *               description:
 *                 type: string
 *                 example: Authentic South Indian cuisine
 *               category:
 *                 type: string
 *                 example: Indian
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               deliveryRadiusKm:
 *                 type: number
 *                 example: 5
 *               operatingHours:
 *                 type: object
 *                 properties:
 *                   open:
 *                     type: string
 *                     example: "09:00"
 *                   close:
 *                     type: string
 *                     example: "22:00"
 *               address:
 *                 type: object
 *                 required: [street, city, state, zipCode, country]
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: 12 MG Road
 *                   city:
 *                     type: string
 *                     example: Bengaluru
 *                   state:
 *                     type: string
 *                     example: Karnataka
 *                   zipCode:
 *                     type: string
 *                     example: "560001"
 *                   country:
 *                     type: string
 *                     example: India
 *     responses:
 *       201:
 *         description: Shop created (starts unapproved and closed)
 *       400:
 *         description: Owner already has a shop
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/", verifyToken, requireRole("owner", "admin"), createShop);

// Public by ID

/**
 * @swagger
 * /api/shops/{id}:
 *   get:
 *     tags: [Shops]
 *     summary: Get a single shop by ID with its full menu
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Shop details with menu items
 *       404:
 *         description: Shop not found
 *   patch:
 *     tags: [Shops]
 *     summary: Update shop details (owner of that shop or admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               deliveryRadiusKm:
 *                 type: number
 *               operatingHours:
 *                 type: object
 *                 properties:
 *                   open:
 *                     type: string
 *                   close:
 *                     type: string
 *     responses:
 *       200:
 *         description: Shop updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shop not found
 *   delete:
 *     tags: [Shops]
 *     summary: Delete a shop and cascade-cancel all its active orders (owner or admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Shop deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shop not found
 */
router.get("/:id", getShopById);
router.patch("/:id", verifyToken, requireRole("owner", "admin"), updateShop);
router.delete("/:id", verifyToken, requireRole("owner", "admin"), deleteShop);

/**
 * @swagger
 * /api/shops/{id}/toggle-open:
 *   patch:
 *     tags: [Shops]
 *     summary: Toggle shop open / closed status (owner or admin)
 *     description: Shop must be approved before it can be opened.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Shop open status toggled
 *       400:
 *         description: Shop is not approved
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shop not found
 */
router.patch("/:id/toggle-open", verifyToken, requireRole("owner", "admin"), toggleShopOpen);

/**
 * @swagger
 * /api/shops/{id}/menu:
 *   post:
 *     tags: [Shops]
 *     summary: Add a new menu item to a shop (owner or admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Butter Chicken
 *               description:
 *                 type: string
 *                 example: Creamy tomato-based chicken curry
 *               price:
 *                 type: number
 *                 example: 280
 *               category:
 *                 type: string
 *                 example: Main Course
 *               isAvailable:
 *                 type: boolean
 *                 example: true
 *               isVeg:
 *                 type: boolean
 *                 example: false
 *               image:
 *                 type: string
 *                 example: https://res.cloudinary.com/sample.jpg
 *     responses:
 *       201:
 *         description: Menu item added - returns full updated menu list
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shop not found
 */
router.post("/:id/menu", verifyToken, requireRole("owner", "admin"), addMenuItem);

/**
 * @swagger
 * /api/shops/{id}/menu/{itemId}:
 *   patch:
 *     tags: [Shops]
 *     summary: Update a menu item (owner or admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop MongoDB ObjectId
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: MenuItem MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               isAvailable:
 *                 type: boolean
 *               isVeg:
 *                 type: boolean
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Menu item updated - returns full updated menu list
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shop or menu item not found
 *   delete:
 *     tags: [Shops]
 *     summary: Soft-delete a menu item (owner or admin)
 *     description: Sets isDeleted=true so the item no longer appears in customer listings.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop MongoDB ObjectId
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: MenuItem MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Menu item soft-deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shop or menu item not found
 */
router.patch("/:id/menu/:itemId", verifyToken, requireRole("owner", "admin"), updateMenuItem);
router.delete("/:id/menu/:itemId", verifyToken, requireRole("owner", "admin"), deleteMenuItem);

/**
 * @swagger
 * /api/shops/{id}/menu/{itemId}/toggle-stock:
 *   patch:
 *     tags: [Shops]
 *     summary: Toggle a menu item in-stock or out-of-stock (owner or admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop MongoDB ObjectId
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: MenuItem MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Item availability toggled
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shop or menu item not found
 */
router.patch("/:id/menu/:itemId/toggle-stock", verifyToken, requireRole("owner", "admin"), toggleItemStock);

export default router;
