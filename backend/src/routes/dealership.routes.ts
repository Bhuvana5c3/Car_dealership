import { Router } from "express";
import * as controller from "../controllers/dealership.controller.js";
import { authenticateJWT } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.get("/", controller.listDealerships);
router.get("/:id", controller.getDealership);
router.post("/", authenticateJWT, requireRole("ADMIN"), controller.createDealership);
router.put("/:id", authenticateJWT, requireRole("ADMIN"), controller.updateDealership);
router.delete("/:id", authenticateJWT, requireRole("ADMIN"), controller.deleteDealership);

export default router;
