import express from "express";
import { verifyToken, requireRole } from "../middleware/auth.middleware.js";
import {
  getMyProfile,
  toggleDuty,
  getPool,
  acceptOrder,
  rejectOrder,
  releaseOrder,
  getEarnings,
} from "../controllers/delivery.controller.js";

const router = express.Router();

router.use(verifyToken, requireRole("delivery_boy", "admin"));

router.get("/me", getMyProfile);


router.patch("/toggle-duty", toggleDuty);


router.get("/pool", getPool);


router.post("/accept/:orderId", acceptOrder);


router.post("/reject/:orderId", rejectOrder);


router.get("/earnings", getEarnings);

router.post("/release/:orderId", releaseOrder);

export default router;
