import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";

const adminEmail = `admin-inv-${Date.now()}@gmail.com`;
const userEmail = `user-inv-${Date.now()}@gmail.com`;
const password = "Password123!";

async function createUser(email: string, role: "USER" | "ADMIN") {
  await prisma.user.deleteMany({ where: { email } });
  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.user.create({ data: { name: email, email, passwordHash, role } });
}

async function login(email: string) {
  const resp = await request(app).post("/api/auth/login").send({ email, password });
  return resp.body.token as string;
}

describe("Inventory API", () => {
  let adminToken: string;
  let userToken: string;
  let dealershipId: string;
  let vehicleId: string;

  beforeAll(async () => {
    await prisma.inventory.deleteMany({});
    await prisma.dealership.deleteMany({ where: { name: { contains: 'test-dealership-' } } });
    await prisma.vehicle.deleteMany({ where: { vin: { contains: 'TESTVIN' } } });

    await createUser(adminEmail, "ADMIN");
    await createUser(userEmail, "USER");
    adminToken = await login(adminEmail);
    userToken = await login(userEmail);

    const d = await prisma.dealership.create({
  data: { name: `test-dealership-${Date.now()}-${Math.random()}` },
});
    dealershipId = d.id;
    const v = await prisma.vehicle.create({
  data: {
    vin: `TESTVIN-${Date.now()}-${Math.random()}`,
    make: "InvMake",
    model: "InvModel",
    year: 2022,
    price: 20000,
    status: "AVAILABLE",
  } as any,
});
    vehicleId = v.id;
  });

  afterAll(async () => {
    await prisma.inventory.deleteMany({});
    await prisma.dealership.deleteMany({ where: { id: dealershipId } });
    await prisma.vehicle.deleteMany({ where: { id: vehicleId } });
    await prisma.user.deleteMany({ where: { email: { in: [adminEmail, userEmail] } } });
    await prisma.$disconnect();
  });

  it("lists dealership inventory", async () => {
    // create inventory directly
    const inv = await prisma.inventory.create({ data: { dealershipId, vehicleId, quantity: 3 } });
    const res = await request(app).get(`/api/dealerships/${dealershipId}/inventory`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    await prisma.inventory.delete({ where: { id: inv.id } });
  });

  it("adds inventory as ADMIN", async () => {
    const res = await request(app).post(`/api/dealerships/${dealershipId}/inventory`).set('Authorization', `Bearer ${adminToken}`).send({ vehicleId, quantity: 5, priceOverride: 19000 });
    expect(res.status).toBe(201);
    expect(res.body.data.quantity).toBe(5);
    // cleanup
    await prisma.inventory.deleteMany({ where: { dealershipId, vehicleId } });
  });

  it("prevents USER from adding inventory", async () => {
    const res = await request(app).post(`/api/dealerships/${dealershipId}/inventory`).set('Authorization', `Bearer ${userToken}`).send({ vehicleId, quantity: 2 });
    expect(res.status).toBe(403);
  });

  it("updates existing inventory instead of creating duplicate", async () => {
    const inv = await prisma.inventory.create({ data: { dealershipId, vehicleId, quantity: 2 } });
    const res = await request(app).post(`/api/dealerships/${dealershipId}/inventory`).set('Authorization', `Bearer ${adminToken}`).send({ vehicleId, quantity: 7 });
    expect(res.status).toBe(201);
    // should update existing record
    const fetched = await prisma.inventory.findUnique({ where: { id: inv.id } });
    expect(fetched?.quantity).toBe(7);
    await prisma.inventory.delete({ where: { id: inv.id } });
  });

  it("deletes inventory as ADMIN", async () => {
    const inv = await prisma.inventory.create({ data: { dealershipId, vehicleId, quantity: 1 } });
    const res = await request(app).delete(`/api/dealerships/${dealershipId}/inventory/${inv.id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const found = await prisma.inventory.findUnique({ where: { id: inv.id } });
    expect(found).toBeNull();
  });

  it("returns 404 for nonexistent dealership", async () => {
    const res = await request(app).post('/api/dealerships/nonexistent-id/inventory').set('Authorization', `Bearer ${adminToken}`).send({ vehicleId, quantity: 1 });
    expect(res.status).toBe(404);
  });

  it("returns 404 for nonexistent vehicle", async () => {
    const res = await request(app).post(`/api/dealerships/${dealershipId}/inventory`).set('Authorization', `Bearer ${adminToken}`).send({ vehicleId: 'nonexistent', quantity: 1 });
    expect(res.status).toBe(404);
  });

  it("validates quantity", async () => {
    const res = await request(app).post(`/api/dealerships/${dealershipId}/inventory`).set('Authorization', `Bearer ${adminToken}`).send({ vehicleId, quantity: -5 });
    expect(res.status).toBe(400);
  });
});
