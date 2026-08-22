import { Router } from "express";
import * as controller from "../controllers/inventory.controller.js";
import { authenticateJWT } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router({ mergeParams: true });

router.get("/", controller.listInventory);
router.post("/", authenticateJWT, requireRole("ADMIN"), controller.addInventory);
router.delete("/:inventoryId", authenticateJWT, requireRole("ADMIN"), controller.deleteInventory);

export default router;
