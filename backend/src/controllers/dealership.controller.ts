import type { Request, Response } from "express";
import * as dealershipService from "../services/dealership.service.js";

export async function listDealerships(req: Request, res: Response) {
  const items = await dealershipService.listDealerships();
  return res.json({ success: true, data: items });
}

export async function getDealership(req: Request, res: Response) {
  const id = req.params.id;
  if (!id || Array.isArray(id)) return res.status(400).json({ success: false, message: "Invalid id" });

  const item = await dealershipService.getDealershipById(id);

  if (!item) {
    return res.status(404).json({ success: false, message: "Dealership not found" });
  }

  return res.json({ success: true, data: item });
}

export async function createDealership(req: Request, res: Response) {
  const { name, address, phone } = req.body;

  if (typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ success: false, message: "Invalid name" });
  }

  const created = await dealershipService.createDealership({ name: name.trim(), address: typeof address === 'string' ? address.trim() : undefined, phone: typeof phone === 'string' ? phone.trim() : undefined });
  return res.status(201).json({ success: true, data: created });
}

export async function updateDealership(req: Request, res: Response) {
  const id = req.params.id;
  if (!id || Array.isArray(id)) return res.status(400).json({ success: false, message: "Invalid id" });

  const { name, address, phone } = req.body;

  try {
    const updated = await dealershipService.updateDealership(id, { name: typeof name === 'string' ? name.trim() : undefined, address: typeof address === 'string' ? address.trim() : undefined, phone: typeof phone === 'string' ? phone.trim() : undefined });
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(404).json({ success: false, message: "Dealership not found" });
  }
}

export async function deleteDealership(req: Request, res: Response) {
  const id = req.params.id;
  if (!id || Array.isArray(id)) return res.status(400).json({ success: false, message: "Invalid id" });

  try {
    await dealershipService.deleteDealership(id);
    return res.json({ success: true, data: null });
  } catch (err) {
    return res.status(404).json({ success: false, message: "Dealership not found or cannot be deleted" });
  }
}
