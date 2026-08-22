import { Router } from "express";
import * as controller from "../controllers/vehicle.controller.js";
import { authenticateJWT } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.get("/", controller.listVehicles);
router.get("/:id", controller.getVehicle);
router.post("/", authenticateJWT, requireRole("ADMIN"), controller.createVehicle);
router.put("/:id", authenticateJWT, requireRole("ADMIN"), controller.updateVehicle);
router.delete("/:id", authenticateJWT, requireRole("ADMIN"), controller.deleteVehicle);

export default router;
