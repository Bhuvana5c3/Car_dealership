import { prisma } from "../config/prisma.js";

export async function listInventoryForDealership(dealershipId: string) {
  return prisma.inventory.findMany({ where: { dealershipId }, include: { vehicle: true } });
}

export async function addOrUpdateInventory(dealershipId: string, vehicleId: string, quantity: number, priceOverride?: number) {
  const existing = await prisma.inventory.findUnique({ where: { dealershipId_vehicleId: { dealershipId, vehicleId } } });

  if (existing) {
    return prisma.inventory.update({ where: { id: existing.id }, data: { quantity, priceOverride } });
  }

  return prisma.inventory.create({ data: { dealershipId, vehicleId, quantity, priceOverride } });
}

export async function deleteInventory(inventoryId: string) {
  return prisma.inventory.delete({ where: { id: inventoryId } });
}
