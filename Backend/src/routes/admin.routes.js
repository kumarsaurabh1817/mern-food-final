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


router.use(verifyToken, requireRole("admin"));


router.get("/dashboard", getDashboardKpis);


router.get("/revenue", getRevenueAnalytics);


router.get("/users", getUsers);

router.patch("/users/:id/approve", approveUser);

router.patch("/users/:id/reject", rejectUser);


router.patch("/users/:id/block", toggleBlockUser);

router.get("/shops", getShops);

router.patch("/shops/:id/approve", approveShop);

router.patch("/shops/:id/suspend", toggleSuspendShop);

export default router;
