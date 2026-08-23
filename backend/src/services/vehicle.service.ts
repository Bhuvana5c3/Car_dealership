import { prisma } from "../config/prisma.js";

export type VehicleFilter = {
  make?: string;
  model?: string;
  category?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
};

function buildWhere(filters: VehicleFilter) {
  const where: any = {};

  if (filters.make) {
    where.make = {
      contains: filters.make,
      mode: "insensitive",
    };
  }

  if (filters.model) {
    where.model = {
      contains: filters.model,
      mode: "insensitive",
    };
  }

  if (filters.category) {
    where.category = {
      contains: filters.category,
      mode: "insensitive",
    };
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined
  ) {
    where.price = {};

    if (filters.minPrice !== undefined) {
      where.price.gte = filters.minPrice;
    }

    if (filters.maxPrice !== undefined) {
      where.price.lte = filters.maxPrice;
    }
  }

  if (
    filters.minYear !== undefined ||
    filters.maxYear !== undefined
  ) {
    where.year = {};

    if (filters.minYear !== undefined) {
      where.year.gte = filters.minYear;
    }

    if (filters.maxYear !== undefined) {
      where.year.lte = filters.maxYear;
    }
  }

  return where;
}

export async function listVehicles(
  filters: VehicleFilter,
  page = 1,
  limit = 20,
) {
  const where = buildWhere(filters);

  const safePage = Math.max(page, 1);
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.vehicle.count({
      where,
    }),
  ]);

  return {
    items,
    total,
  };
}

export async function searchVehicles(filters: VehicleFilter) {
  const where = buildWhere(filters);

  return prisma.vehicle.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getVehicleById(id: string) {
  return prisma.vehicle.findUnique({
    where: { id },
  });
}

export async function createVehicle(data: any) {
  return prisma.vehicle.create({
    data: {
      ...data,
      category: data.category || "Other",
      quantity: data.quantity ?? 0,
    },
  });
}

export async function updateVehicle(
  id: string,
  data: any,
) {
  return prisma.vehicle.update({
    where: { id },
    data,
  });
}

export async function deleteVehicle(id: string) {
  return prisma.vehicle.delete({
    where: { id },
  });
}

export class VehicleNotFoundError extends Error {}

export class InsufficientStockError extends Error {}

export async function purchaseVehicle(id: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
  });

  if (!vehicle) {
    throw new VehicleNotFoundError("Vehicle not found");
  }

  if (vehicle.quantity <= 0) {
    throw new InsufficientStockError(
      "Vehicle is out of stock",
    );
  }

  const updatedVehicle = await prisma.vehicle.update({
    where: { id },
    data: {
      quantity: {
        decrement: 1,
      },
    },
  });

  return updatedVehicle;
}

export async function restockVehicle(
  id: string,
  quantity: number,
) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
  });

  if (!vehicle) {
    throw new VehicleNotFoundError("Vehicle not found");
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Restock quantity must be greater than 0");
  }

  return prisma.vehicle.update({
    where: { id },
    data: {
      quantity: {
        increment: quantity,
      },
    },
  });
}