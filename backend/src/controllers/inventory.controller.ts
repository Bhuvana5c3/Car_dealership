import type { Request, Response } from "express";
import * as inventoryService from "../services/inventory.service.js";
import { prisma } from "../config/prisma.js";

export async function listInventory(req: Request, res: Response) {
  const dealershipId = req.params.id;
  if (!dealershipId || Array.isArray(dealershipId)) return res.status(400).json({ success: false, message: "Invalid dealership id" });

  // ensure dealership exists
  const dealership = await prisma.dealership.findUnique({ where: { id: dealershipId } });
  if (!dealership) return res.status(404).json({ success: false, message: "Dealership not found" });

  const items = await inventoryService.listInventoryForDealership(dealershipId);
  return res.json({ success: true, data: items });
}

export async function addInventory(req: Request, res: Response) {
  const dealershipId = req.params.id;
  if (!dealershipId || Array.isArray(dealershipId)) return res.status(400).json({ success: false, message: "Invalid dealership id" });

  const { vehicleId, quantity, priceOverride } = req.body as any;

  if (typeof vehicleId !== "string" || vehicleId.trim().length === 0) return res.status(400).json({ success: false, message: "vehicleId required" });
  if (typeof quantity !== "number" && typeof quantity !== "string") return res.status(400).json({ success: false, message: "quantity required" });

  const q = Number(quantity);
  if (!Number.isInteger(q) || q < 0) return res.status(400).json({ success: false, message: "Invalid quantity" });

  // ensure dealership and vehicle exist
  const [dealership, vehicle] = await Promise.all([
    prisma.dealership.findUnique({ where: { id: dealershipId } }),
    prisma.vehicle.findUnique({ where: { id: vehicleId } }),
  ]);

  if (!dealership) return res.status(404).json({ success: false, message: "Dealership not found" });
  if (!vehicle) return res.status(404).json({ success: false, message: "Vehicle not found" });

  const result = await inventoryService.addOrUpdateInventory(dealershipId, vehicleId, q, priceOverride !== undefined ? Number(priceOverride) : undefined);

  return res.status(201).json({ success: true, data: result });
}

export async function deleteInventory(req: Request, res: Response) {
  const dealershipId = req.params.id;
  const inventoryId = req.params.inventoryId;

  if (!dealershipId || Array.isArray(dealershipId)) return res.status(400).json({ success: false, message: "Invalid dealership id" });
  if (!inventoryId || Array.isArray(inventoryId)) return res.status(400).json({ success: false, message: "Invalid inventory id" });

  // ensure dealership exists
  const dealership = await prisma.dealership.findUnique({ where: { id: dealershipId } });
  if (!dealership) return res.status(404).json({ success: false, message: "Dealership not found" });

  try {
    await inventoryService.deleteInventory(inventoryId);
    return res.json({ success: true, data: null });
  } catch (err) {
    return res.status(404).json({ success: false, message: "Inventory not found or cannot be deleted" });
  }
}
