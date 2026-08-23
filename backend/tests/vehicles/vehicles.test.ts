import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";

const adminEmail = `admin-veh-${Date.now()}@gmail.com`;
const userEmail = `user-veh-${Date.now()}@gmail.com`;
const password = "Password123!";

async function createUser(email: string, role: "USER" | "ADMIN") {
  await prisma.user.deleteMany({
    where: { email },
  });

  const passwordHash = await bcrypt.hash(password, 12);

  return prisma.user.create({
    data: {
      name: email,
      email,
      passwordHash,
      role,
    },
  });
}

async function login(email: string) {
  const resp = await request(app)
    .post("/api/auth/login")
    .send({
      email,
      password,
    });

  return resp.body.token as string;
}

describe("Vehicles API", () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    await prisma.vehicle.deleteMany({
      where: {
        vin: {
          contains: "TESTVIN",
        },
      },
    });

    await createUser(adminEmail, "ADMIN");
    await createUser(userEmail, "USER");

    adminToken = await login(adminEmail);
    userToken = await login(userEmail);
  });

  afterAll(async () => {
    await prisma.vehicle.deleteMany({
      where: {
        vin: {
          contains: "TESTVIN",
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [adminEmail, userEmail],
        },
      },
    });

    await prisma.$disconnect();
  });

  it("lists vehicles", async () => {
    const v = await prisma.vehicle.create({
      data: {
        vin: `TESTVIN-${Date.now()}`,
        make: "Toyota",
        model: "Camry",
        year: 2020,
        price: 10000,
        status: "AVAILABLE",
      } as any,
    });

    const res = await request(app).get("/api/vehicles");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    await prisma.vehicle.delete({
      where: { id: v.id },
    });
  });

  it("gets a vehicle", async () => {
    const v = await prisma.vehicle.create({
      data: {
        vin: `TESTVIN-${Date.now()}`,
        make: "Ford",
        model: "Fiesta",
        year: 2019,
        price: 8000,
        status: "AVAILABLE",
      } as any,
    });

    const res = await request(app).get(`/api/vehicles/${v.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(v.id);

    await prisma.vehicle.delete({
      where: { id: v.id },
    });
  });

  it("creates vehicle as ADMIN", async () => {
    const body = {
      vin: `TESTVIN-${Date.now()}`,
      make: "Honda",
      model: "Civic",
      year: 2021,
      mileage: 5000,
      price: 15000,
      status: "AVAILABLE",
    };

    const res = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    await prisma.vehicle.delete({
      where: { id: res.body.data.id },
    });
  });

  it("prevents USER from creating vehicle", async () => {
    const body = {
      vin: `TESTVIN-${Date.now()}`,
      make: "Nissan",
      model: "Altima",
      year: 2021,
      mileage: 1000,
      price: 12000,
      status: "AVAILABLE",
    };

    const res = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${userToken}`)
      .send(body);

    expect(res.status).toBe(403);
  });

  it("updates vehicle as ADMIN", async () => {
    const v = await prisma.vehicle.create({
      data: {
        vin: `TESTVIN-${Date.now()}`,
        make: "Mazda",
        model: "3",
        year: 2018,
        price: 9000,
        status: "AVAILABLE",
      } as any,
    });

    const res = await request(app)
      .put(`/api/vehicles/${v.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        price: 9500,
      });

    expect(res.status).toBe(200);
    expect(Number(res.body.data.price)).toBe(9500);

    await prisma.vehicle.delete({
      where: { id: v.id },
    });
  });

  it("deletes vehicle as ADMIN", async () => {
    const v = await prisma.vehicle.create({
      data: {
        vin: `TESTVIN-${Date.now()}`,
        make: "Kia",
        model: "Soul",
        year: 2017,
        price: 7000,
        status: "AVAILABLE",
      } as any,
    });

    const res = await request(app)
      .delete(`/api/vehicles/${v.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const found = await prisma.vehicle.findUnique({
      where: { id: v.id },
    });

    expect(found).toBeNull();
  });

  it("rejects duplicate VIN", async () => {
    const vin = `TESTVIN-DUP-${Date.now()}`;

    const v = await prisma.vehicle.create({
      data: {
        vin,
        make: "A",
        model: "B",
        year: 2020,
        price: 1000,
        status: "AVAILABLE",
      } as any,
    });

    const res = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        vin,
        make: "X",
        model: "Y",
        year: 2020,
        price: 1000,
        status: "AVAILABLE",
      });

    expect(res.status).toBe(409);

    await prisma.vehicle.delete({
      where: { id: v.id },
    });
  });

  it("validates year, price, mileage", async () => {
    const badYear = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        vin: `TESTVIN-${Date.now()}`,
        make: "X",
        model: "Y",
        year: 1000,
        price: 1000,
        status: "AVAILABLE",
      });

    expect(badYear.status).toBe(400);

    const badPrice = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        vin: `TESTVIN-${Date.now()}`,
        make: "X",
        model: "Y",
        year: 2020,
        price: -5,
        status: "AVAILABLE",
      });

    expect(badPrice.status).toBe(400);

    const badMileage = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        vin: `TESTVIN-${Date.now()}`,
        make: "X",
        model: "Y",
        year: 2020,
        mileage: -10,
        price: 1000,
        status: "AVAILABLE",
      });

    expect(badMileage.status).toBe(400);
  });

  it("supports filters and pagination", async () => {
    const v1 = await prisma.vehicle.create({
      data: {
        vin: `TESTVIN-${Date.now()}-1`,
        make: "FilterMake",
        model: "M1",
        year: 2019,
        price: 5000,
        status: "AVAILABLE",
      } as any,
    });

    const v2 = await prisma.vehicle.create({
      data: {
        vin: `TESTVIN-${Date.now()}-2`,
        make: "FilterMake",
        model: "M2",
        year: 2021,
        price: 15000,
        status: "SOLD",
      } as any,
    });

    const res = await request(app)
      .get("/api/vehicles")
      .query({
        make: "FilterMake",
        minPrice: 4000,
        maxPrice: 16000,
        page: 1,
        limit: 1,
      });

    expect(res.status).toBe(200);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(1);

    await prisma.vehicle.delete({
      where: { id: v1.id },
    });

    await prisma.vehicle.delete({
      where: { id: v2.id },
    });
  });

  it("returns 404 for nonexistent vehicle", async () => {
    const res = await request(app).get(
      "/api/vehicles/nonexistent-id",
    );

    expect(res.status).toBe(404);
  });

  // ---------------------------------------------------------
  // NEW TDD TESTS REQUIRED BY THE KATA
  // ---------------------------------------------------------

  it("creates a vehicle with category and quantity", async () => {
    const body = {
      vin: `TESTVIN-CATEGORY-${Date.now()}`,
      make: "Toyota",
      model: "Corolla",
      year: 2023,
      mileage: 1000,
      price: 20000,
      category: "Sedan",
      quantity: 5,
      status: "AVAILABLE",
    };

    const res = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body.data.category).toBe("Sedan");
    expect(res.body.data.quantity).toBe(5);

    await prisma.vehicle.delete({
      where: { id: res.body.data.id },
    });
  });

  it("searches vehicles by make, model, category and price range", async () => {
    const vehicle = await prisma.vehicle.create({
      data: {
        vin: `TESTVIN-SEARCH-${Date.now()}`,
        make: "Toyota",
        model: "Corolla",
        year: 2023,
        price: 20000,
        category: "Sedan",
        quantity: 3,
        status: "AVAILABLE",
      } as any,
    });

    const res = await request(app)
      .get("/api/vehicles/search")
      .query({
        make: "Toyota",
        model: "Corolla",
        category: "Sedan",
        minPrice: 15000,
        maxPrice: 25000,
      });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    expect(
      res.body.data.some(
        (item: { id: string }) => item.id === vehicle.id,
      ),
    ).toBe(true);

    await prisma.vehicle.delete({
      where: { id: vehicle.id },
    });
  });

  it("purchases a vehicle and decreases its quantity", async () => {
    const vehicle = await prisma.vehicle.create({
      data: {
        vin: `TESTVIN-PURCHASE-${Date.now()}`,
        make: "Honda",
        model: "City",
        year: 2023,
        price: 18000,
        category: "Sedan",
        quantity: 3,
        status: "AVAILABLE",
      } as any,
    });

    const res = await request(app)
      .post(`/api/vehicles/${vehicle.id}/purchase`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.quantity).toBe(2);

    await prisma.vehicle.delete({
      where: { id: vehicle.id },
    });
  });

  it("does not allow purchasing a vehicle with zero quantity", async () => {
    const vehicle = await prisma.vehicle.create({
      data: {
        vin: `TESTVIN-SOLDOUT-${Date.now()}`,
        make: "Ford",
        model: "Focus",
        year: 2022,
        price: 16000,
        category: "Hatchback",
        quantity: 0,
        status: "AVAILABLE",
      } as any,
    });

    const res = await request(app)
      .post(`/api/vehicles/${vehicle.id}/purchase`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(400);

    await prisma.vehicle.delete({
      where: { id: vehicle.id },
    });
  });

  it("restocks a vehicle and increases its quantity as ADMIN", async () => {
    const vehicle = await prisma.vehicle.create({
      data: {
        vin: `TESTVIN-RESTOCK-${Date.now()}`,
        make: "BMW",
        model: "3 Series",
        year: 2024,
        price: 45000,
        category: "Sedan",
        quantity: 2,
        status: "AVAILABLE",
      } as any,
    });

    const res = await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        quantity: 5,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.quantity).toBe(7);

    await prisma.vehicle.delete({
      where: { id: vehicle.id },
    });
  });

  it("prevents USER from restocking a vehicle", async () => {
    const vehicle = await prisma.vehicle.create({
      data: {
        vin: `TESTVIN-RESTOCK-USER-${Date.now()}`,
        make: "Audi",
        model: "A4",
        year: 2023,
        price: 40000,
        category: "Sedan",
        quantity: 2,
        status: "AVAILABLE",
      } as any,
    });

    const res = await request(app)
      .post(`/api/vehicles/${vehicle.id}/restock`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        quantity: 5,
      });

    expect(res.status).toBe(403);

    await prisma.vehicle.delete({
      where: { id: vehicle.id },
    });
  });
});