import type { Request, Response } from "express";
import * as vehicleService from "../services/vehicle.service.js";

export async function listVehicles(req: Request, res: Response) {
  const q = (v: unknown) => Array.isArray(v) ? v[0] : v;
  const page = q(req.query.page) ?? "1";
  const limit = q(req.query.limit) ?? "20";
  const make = q(req.query.make);
  const model = q(req.query.model);
  const status = q(req.query.status);
  const minPrice = q(req.query.minPrice);
  const maxPrice = q(req.query.maxPrice);
  const minYear = q(req.query.minYear);
  const maxYear = q(req.query.maxYear);

  const p = Math.max(1, parseInt(String(page), 10) || 1);
  const l = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 20));

  const filters = {
    make: typeof make === 'string' ? make : undefined,
    model: typeof model === 'string' ? model : undefined,
    status: typeof status === 'string' ? status : undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    minYear: minYear ? Number(minYear) : undefined,
    maxYear: maxYear ? Number(maxYear) : undefined,
  };

  const { items, total } = await vehicleService.listVehicles(filters, p, l);

  const totalPages = Math.ceil(total / l);

  return res.json({ success: true, data: items, pagination: { page: p, limit: l, total, totalPages } });
}

export async function getVehicle(req: Request, res: Response) {
  const id = req.params.id;
  if (!id || Array.isArray(id)) return res.status(400).json({ success: false, message: "Invalid id" });
  const item = await vehicleService.getVehicleById(id);
  if (!item) return res.status(404).json({ success: false, message: "Vehicle not found" });
  return res.json({ success: true, data: item });
}

export async function createVehicle(req: Request, res: Response) {
  const { vin, make, model, year, mileage, price, status } = req.body;

  if (typeof vin !== "string" || vin.trim().length === 0) return res.status(400).json({ success: false, message: "VIN required" });
  if (typeof make !== "string" || make.trim().length === 0) return res.status(400).json({ success: false, message: "Make required" });
  if (typeof model !== "string" || model.trim().length === 0) return res.status(400).json({ success: false, message: "Model required" });
  if (typeof year !== "number" && typeof year !== "string") return res.status(400).json({ success: false, message: "Year required" });

  const y = Number(year);
  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(y) || y < 1886 || y > currentYear + 1) return res.status(400).json({ success: false, message: "Invalid year" });

  if (mileage !== undefined && Number(mileage) < 0) return res.status(400).json({ success: false, message: "Invalid mileage" });
  if (Number(price) < 0) return res.status(400).json({ success: false, message: "Invalid price" });

  try {
    const created = await vehicleService.createVehicle({ vin: vin.trim(), make: make.trim(), model: model.trim(), year: y, mileage: mileage !== undefined ? Number(mileage) : undefined, price: Number(price), status });
    return res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    if (typeof err === "object" && err !== null && "code" in err && (err as any).code === "P2002") {
      return res.status(409).json({ success: false, message: "VIN already exists" });
    }
    throw err;
  }
}

export async function updateVehicle(req: Request, res: Response) {
  const id = req.params.id;
  if (!id || Array.isArray(id)) return res.status(400).json({ success: false, message: "Invalid id" });
  const data = req.body;

  if (data.year !== undefined) {
    const y = Number(data.year);
    const currentYear = new Date().getFullYear();
    if (!Number.isInteger(y) || y < 1886 || y > currentYear + 1) return res.status(400).json({ success: false, message: "Invalid year" });
    data.year = y;
  }

  if (data.mileage !== undefined && Number(data.mileage) < 0) return res.status(400).json({ success: false, message: "Invalid mileage" });
  if (data.price !== undefined && Number(data.price) < 0) return res.status(400).json({ success: false, message: "Invalid price" });

  try {
    const updated = await vehicleService.updateVehicle(id, data);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(404).json({ success: false, message: "Vehicle not found" });
  }
}

export async function deleteVehicle(req: Request, res: Response) {
  const id = req.params.id;
  if (!id || Array.isArray(id)) return res.status(400).json({ success: false, message: "Invalid id" });

  try {
    await vehicleService.deleteVehicle(id);
    return res.json({ success: true, data: null });
  } catch (err) {
    return res.status(404).json({ success: false, message: "Vehicle not found or cannot be deleted" });
  }
}
