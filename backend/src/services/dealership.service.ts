import { prisma } from "../config/prisma.js";

export async function listDealerships() {
  return prisma.dealership.findMany({ orderBy: { name: "asc" } });
}

export async function getDealershipById(id: string) {
  return prisma.dealership.findUnique({ where: { id } });
}

export async function createDealership(data: { name: string; address?: string; phone?: string }) {
  return prisma.dealership.create({ data });
}

export async function updateDealership(id: string, data: { name?: string; address?: string; phone?: string }) {
  return prisma.dealership.update({ where: { id }, data });
}

export async function deleteDealership(id: string) {
  return prisma.dealership.delete({ where: { id } });
}
