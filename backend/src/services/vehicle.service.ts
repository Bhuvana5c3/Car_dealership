import { prisma } from "../config/prisma.js";

export type VehicleFilter = {
  make?: string;
  model?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
};

export async function listVehicles(filters: VehicleFilter, page = 1, limit = 20) {
  const where: any = {};

  if (filters.make) where.make = { contains: filters.make, mode: "insensitive" };
  if (filters.model) where.model = { contains: filters.model, mode: "insensitive" };
  if (filters.status) where.status = filters.status;
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
  }
  if (filters.minYear !== undefined || filters.maxYear !== undefined) {
    where.year = {};
    if (filters.minYear !== undefined) where.year.gte = filters.minYear;
    if (filters.maxYear !== undefined) where.year.lte = filters.maxYear;
  }

  const take = Math.min(limit, 100);
  const skip = (page - 1) * take;

  const [items, total] = await Promise.all([
    prisma.vehicle.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    prisma.vehicle.count({ where }),
  ]);

  return { items, total };
}

export async function getVehicleById(id: string) {
  return prisma.vehicle.findUnique({ where: { id } });
}

export async function createVehicle(data: any) {
  return prisma.vehicle.create({ data });
}

export async function updateVehicle(id: string, data: any) {
  return prisma.vehicle.update({ where: { id }, data });
}

export async function deleteVehicle(id: string) {
  return prisma.vehicle.delete({ where: { id } });
}
