import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";

const registrationInput = {
  name: "Test User",
  email: "test.car.dealership@gmail.com",
  password: "Password123!",
};

beforeEach(async () => {
  await prisma.user.deleteMany({
    where: { email: registrationInput.email },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/auth/register", () => {
  it("registers a new user with a Gmail address", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(registrationInput);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("user");
    expect(response.body.user.email).toBe(registrationInput.email);
    expect(response.body.user).not.toHaveProperty("passwordHash");
  });

  it("rejects a duplicate email", async () => {
    await request(app)
      .post("/api/auth/register")
      .send(registrationInput);

    const response = await request(app)
      .post("/api/auth/register")
      .send(registrationInput);

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/already registered/i);
  });

  it.each([
    ["invalid email", { ...registrationInput, email: "not-an-email" }],
    ["non-Gmail email", { ...registrationInput, email: "test@example.com" }],
    ["Yahoo email", { ...registrationInput, email: "test@yahoo.com" }],
    ["missing name", { ...registrationInput, name: undefined }],
    ["missing password", { ...registrationInput, password: undefined }],
    ["short password", { ...registrationInput, password: "short" }],
  ])("rejects %s", async (_caseName, body) => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(body);

    expect(response.status).toBe(400);
  });

  it("hashes the stored password", async () => {
    await request(app)
      .post("/api/auth/register")
      .send(registrationInput);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: registrationInput.email },
    });

    expect(user.passwordHash).not.toBe(registrationInput.password);
  });
});