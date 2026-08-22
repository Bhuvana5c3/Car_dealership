import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";

const adminEmail = `admin-test-${Date.now()}@example.com`;
const userEmail = `user-test-${Date.now()}@example.com`;
const password = "Password123!";

async function createUser(email: string, role: "USER" | "ADMIN") {
  await prisma.user.deleteMany({ where: { email } });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { name: email, email, passwordHash, role } });
  return user;
}

async function login(email: string) {
  const resp = await request(app).post("/api/auth/login").send({ email, password });
  return resp.body.token as string;
}

describe("Dealerships API", () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    await prisma.dealership.deleteMany({ where: { name: { contains: "test-dealership-" } } });

    await createUser(adminEmail, "ADMIN");
    await createUser(userEmail, "USER");

    adminToken = await login(adminEmail);
    userToken = await login(userEmail);
  });

  afterAll(async () => {
    await prisma.dealership.deleteMany({ where: { name: { contains: "test-dealership-" } } });
    await prisma.user.deleteMany({ where: { email: { in: [adminEmail, userEmail] } } });
    await prisma.$disconnect();
  });

  it("lists dealerships", async () => {
    const d1 = await prisma.dealership.create({ data: { name: `test-dealership-${Date.now()}`, address: "Addr" } });
    const res = await request(app).get('/api/dealerships');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    // cleanup
    await prisma.dealership.delete({ where: { id: d1.id } });
  });

  it("gets a dealership", async () => {
    const d = await prisma.dealership.create({ data: { name: `test-dealership-${Date.now()}` } });
    const res = await request(app).get(`/api/dealerships/${d.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(d.id);
    await prisma.dealership.delete({ where: { id: d.id } });
  });

  it("creates dealership as ADMIN", async () => {
    const res = await request(app).post('/api/dealerships').set('Authorization', `Bearer ${adminToken}`).send({ name: `test-dealership-${Date.now()}`, address: 'A', phone: 'P' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    await prisma.dealership.delete({ where: { id: res.body.data.id } });
  });

  it("prevents USER from creating dealership", async () => {
    const res = await request(app).post('/api/dealerships').set('Authorization', `Bearer ${userToken}`).send({ name: `test-dealership-${Date.now()}` });
    expect(res.status).toBe(403);
  });

  it("updates dealership as ADMIN", async () => {
    const d = await prisma.dealership.create({ data: { name: `test-dealership-${Date.now()}` } });
    const res = await request(app).put(`/api/dealerships/${d.id}`).set('Authorization', `Bearer ${adminToken}`).send({ name: 'Updated Name' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Name');
    await prisma.dealership.delete({ where: { id: d.id } });
  });

  it("prevents USER from updating dealership", async () => {
    const d = await prisma.dealership.create({ data: { name: `test-dealership-${Date.now()}` } });
    const res = await request(app).put(`/api/dealerships/${d.id}`).set('Authorization', `Bearer ${userToken}`).send({ name: 'X' });
    expect(res.status).toBe(403);
    await prisma.dealership.delete({ where: { id: d.id } });
  });

  it("deletes dealership as ADMIN", async () => {
    const d = await prisma.dealership.create({ data: { name: `test-dealership-${Date.now()}` } });
    const res = await request(app).delete(`/api/dealerships/${d.id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    // ensure deleted
    const found = await prisma.dealership.findUnique({ where: { id: d.id } });
    expect(found).toBeNull();
  });

  it("returns 404 for nonexistent dealership", async () => {
    const res = await request(app).get('/api/dealerships/nonexistent-id');
    expect(res.status).toBe(404);
  });

  it("validates create dealership input", async () => {
    const res = await request(app).post('/api/dealerships').set('Authorization', `Bearer ${adminToken}`).send({});
    expect(res.status).toBe(400);
  });
});
