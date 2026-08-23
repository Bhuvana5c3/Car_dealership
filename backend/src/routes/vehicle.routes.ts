import { Router } from "express";
import * as controller from "../controllers/vehicle.controller.js";
import { authenticateJWT } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// Public vehicle listing
router.get("/", controller.listVehicles);

// Public vehicle search
// Must come before /:id
router.get("/search", controller.searchVehicles);

// Public single vehicle
router.get("/:id", controller.getVehicle);

// Admin: create vehicle
router.post(
  "/",
  authenticateJWT,
  requireRole("ADMIN"),
  controller.createVehicle,
);

// Admin: update vehicle
router.put(
  "/:id",
  authenticateJWT,
  requireRole("ADMIN"),
  controller.updateVehicle,
);

// Admin: delete vehicle
router.delete(
  "/:id",
  authenticateJWT,
  requireRole("ADMIN"),
  controller.deleteVehicle,
);

// Authenticated users: purchase vehicle
router.post(
  "/:id/purchase",
  authenticateJWT,
  controller.purchaseVehicle,
);

// Admin: restock vehicle
router.post(
  "/:id/restock",
  authenticateJWT,
  requireRole("ADMIN"),
  controller.restockVehicle,
);

export default router;