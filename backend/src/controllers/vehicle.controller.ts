import type { Request, Response } from "express";
import * as vehicleService from "../services/vehicle.service.js";

export async function listVehicles(req: Request, res: Response) {
  const q = (v: unknown) => (Array.isArray(v) ? v[0] : v);

  const page = q(req.query.page) ?? "1";
  const limit = q(req.query.limit) ?? "20";

  const make = q(req.query.make);
  const model = q(req.query.model);
  const category = q(req.query.category);
  const status = q(req.query.status);

  const minPrice = q(req.query.minPrice);
  const maxPrice = q(req.query.maxPrice);
  const minYear = q(req.query.minYear);
  const maxYear = q(req.query.maxYear);

  const p = Math.max(1, parseInt(String(page), 10) || 1);

  const l = Math.max(
    1,
    Math.min(100, parseInt(String(limit), 10) || 20),
  );

  const filters = {
    make: typeof make === "string" ? make : undefined,
    model: typeof model === "string" ? model : undefined,
    category: typeof category === "string" ? category : undefined,
    status: typeof status === "string" ? status : undefined,

    minPrice:
      minPrice !== undefined && minPrice !== ""
        ? Number(minPrice)
        : undefined,

    maxPrice:
      maxPrice !== undefined && maxPrice !== ""
        ? Number(maxPrice)
        : undefined,

    minYear:
      minYear !== undefined && minYear !== ""
        ? Number(minYear)
        : undefined,

    maxYear:
      maxYear !== undefined && maxYear !== ""
        ? Number(maxYear)
        : undefined,
  };

  const { items, total } = await vehicleService.listVehicles(
    filters,
    p,
    l,
  );

  return res.json({
    success: true,
    data: items,
    pagination: {
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l),
    },
  });
}

export async function searchVehicles(req: Request, res: Response) {
  const q = (v: unknown) => (Array.isArray(v) ? v[0] : v);

  const make = q(req.query.make);
  const model = q(req.query.model);
  const category = q(req.query.category);
  const minPrice = q(req.query.minPrice);
  const maxPrice = q(req.query.maxPrice);

  const filters = {
    make: typeof make === "string" ? make : undefined,
    model: typeof model === "string" ? model : undefined,
    category: typeof category === "string" ? category : undefined,

    minPrice:
      minPrice !== undefined && minPrice !== ""
        ? Number(minPrice)
        : undefined,

    maxPrice:
      maxPrice !== undefined && maxPrice !== ""
        ? Number(maxPrice)
        : undefined,
  };

  if (
    filters.minPrice !== undefined &&
    !Number.isFinite(filters.minPrice)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid minimum price",
    });
  }

  if (
    filters.maxPrice !== undefined &&
    !Number.isFinite(filters.maxPrice)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid maximum price",
    });
  }

  if (
    filters.minPrice !== undefined &&
    filters.maxPrice !== undefined &&
    filters.minPrice > filters.maxPrice
  ) {
    return res.status(400).json({
      success: false,
      message: "Minimum price cannot exceed maximum price",
    });
  }

  const vehicles = await vehicleService.searchVehicles(filters);

  return res.json({
    success: true,
    data: vehicles,
  });
}

export async function getVehicle(req: Request, res: Response) {
  const id = req.params.id;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid id",
    });
  }

  const item = await vehicleService.getVehicleById(id);

  if (!item) {
    return res.status(404).json({
      success: false,
      message: "Vehicle not found",
    });
  }

  return res.json({
    success: true,
    data: item,
  });
}

export async function createVehicle(req: Request, res: Response) {
  const {
    vin,
    make,
    model,
    category,
    year,
    mileage,
    price,
    quantity,
    status,
  } = req.body;

  if (
    typeof vin !== "string" ||
    vin.trim().length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: "VIN required",
    });
  }

  if (
    typeof make !== "string" ||
    make.trim().length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Make required",
    });
  }

  if (
    typeof model !== "string" ||
    model.trim().length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Model required",
    });
  }

  if (
    typeof year !== "number" &&
    typeof year !== "string"
  ) {
    return res.status(400).json({
      success: false,
      message: "Year required",
    });
  }

  const y = Number(year);
  const currentYear = new Date().getFullYear();

  if (
    !Number.isInteger(y) ||
    y < 1886 ||
    y > currentYear + 1
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid year",
    });
  }

  if (
    mileage !== undefined &&
    (!Number.isFinite(Number(mileage)) ||
      Number(mileage) < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid mileage",
    });
  }

  if (
    price === undefined ||
    !Number.isFinite(Number(price)) ||
    Number(price) < 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid price",
    });
  }

  if (
    quantity !== undefined &&
    (!Number.isInteger(Number(quantity)) ||
      Number(quantity) < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid quantity",
    });
  }

  try {
    const created = await vehicleService.createVehicle({
      vin: vin.trim(),
      make: make.trim(),
      model: model.trim(),

      category:
        typeof category === "string" &&
        category.trim()
          ? category.trim()
          : "Other",

      year: y,

      mileage:
        mileage !== undefined
          ? Number(mileage)
          : undefined,

      price: Number(price),

      quantity:
        quantity !== undefined
          ? Number(quantity)
          : 0,

      status: status || "AVAILABLE",
    });

    return res.status(201).json({
      success: true,
      data: created,
    });
  } catch (err: any) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      err.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message: "VIN already exists",
      });
    }

    throw err;
  }
}

export async function updateVehicle(
  req: Request,
  res: Response,
) {
  const id = req.params.id;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid id",
    });
  }

  const data = { ...req.body };

  if (data.year !== undefined) {
    const y = Number(data.year);
    const currentYear = new Date().getFullYear();

    if (
      !Number.isInteger(y) ||
      y < 1886 ||
      y > currentYear + 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid year",
      });
    }

    data.year = y;
  }

  if (
    data.mileage !== undefined &&
    (!Number.isFinite(Number(data.mileage)) ||
      Number(data.mileage) < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid mileage",
    });
  }

  if (
    data.price !== undefined &&
    (!Number.isFinite(Number(data.price)) ||
      Number(data.price) < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid price",
    });
  }

  if (
    data.quantity !== undefined &&
    (!Number.isInteger(Number(data.quantity)) ||
      Number(data.quantity) < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid quantity",
    });
  }

  if (data.category !== undefined) {
    if (
      typeof data.category !== "string" ||
      data.category.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    data.category = data.category.trim();
  }

  try {
    const updated = await vehicleService.updateVehicle(
      id,
      data,
    );

    return res.json({
      success: true,
      data: updated,
    });
  } catch {
    return res.status(404).json({
      success: false,
      message: "Vehicle not found",
    });
  }
}

export async function deleteVehicle(
  req: Request,
  res: Response,
) {
  const id = req.params.id;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid id",
    });
  }

  try {
    await vehicleService.deleteVehicle(id);

    return res.json({
      success: true,
      data: null,
    });
  } catch {
    return res.status(404).json({
      success: false,
      message: "Vehicle not found or cannot be deleted",
    });
  }
}

export async function purchaseVehicle(
  req: Request,
  res: Response,
) {
  const id = req.params.id;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid id",
    });
  }

  try {
    const vehicle =
      await vehicleService.purchaseVehicle(id);

    return res.json({
      success: true,
      data: vehicle,
    });
  } catch (err) {
    if (
      err instanceof vehicleService.InsufficientStockError
    ) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    if (
      err instanceof vehicleService.VehicleNotFoundError
    ) {
      return res.status(404).json({
        success: false,
        message: err.message,
      });
    }

    throw err;
  }
}

export async function restockVehicle(
  req: Request,
  res: Response,
) {
  const id = req.params.id;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid id",
    });
  }

  const quantity = Number(req.body.quantity);

  if (
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Restock quantity must be greater than 0",
    });
  }

  try {
    const vehicle =
      await vehicleService.restockVehicle(
        id,
        quantity,
      );

    return res.json({
      success: true,
      data: vehicle,
    });
  } catch (err) {
    if (
      err instanceof vehicleService.VehicleNotFoundError
    ) {
      return res.status(404).json({
        success: false,
        message: err.message,
      });
    }

    throw err;
  }
}