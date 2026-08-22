import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";

describe("POST /api/auth/login", () => {
  const testEmail = "login-test-user@example.com";

  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: {
        email: testEmail,
      },
    });

    await prisma.user.create({
      data: {
        name: "Login Test User",
        email: testEmail,
        passwordHash: await bcrypt.hash("Password123", 12),
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: testEmail,
      },
    });

    await prisma.$disconnect();
  });

  it("logs in with valid credentials and returns a JWT", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: "Password123",
      });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(typeof response.body.token).toBe("string");
  });

  it("returns a JWT containing the user ID", async () => {
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: "Password123",
      });

    expect(response.status).toBe(200);

    const decoded = jwt.decode(response.body.token) as {
      userId?: string;
    };

    expect(decoded.userId).toBe(user?.id);
  });

  it("rejects an incorrect password", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: "WrongPassword123",
      });

    expect(response.status).toBe(401);
  });

  it("rejects a nonexistent email", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "nonexistent-login-user@example.com",
        password: "Password123",
      });

    expect(response.status).toBe(401);
  });

  it("rejects a missing email", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        password: "Password123",
      });

    expect(response.status).toBe(400);
  });

  it("rejects a missing password", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: testEmail,
      });

    expect(response.status).toBe(400);
  });

  it("rejects an invalid email", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "not-an-email",
        password: "Password123",
      });

    expect(response.status).toBe(400);
  });

  it("does not expose the password hash", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: "Password123",
      });

    expect(response.body.passwordHash).toBeUndefined();
    expect(response.body.user?.passwordHash).toBeUndefined();
  });
});