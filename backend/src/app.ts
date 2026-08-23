import cors from "cors";
import express, { type ErrorRequestHandler } from "express";

import authRouter from "./routes/auth.routes.js";
import dealershipRouter from "./routes/dealership.routes.js";
import vehicleRouter from "./routes/vehicle.routes.js";
import inventoryRouter from "./routes/inventory.routes.js";

import {
  DuplicateEmailError,
  ValidationError,
} from "./services/auth.service.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use((req, _res, next) => {
  console.log("DEBUG BODY:", req.body);
  next();
});

app.use("/api/auth", authRouter);
app.use("/api/dealerships", dealershipRouter);
app.use("/api/vehicles", vehicleRouter);

// Inventory routes
app.use("/api/dealerships/:id/inventory", inventoryRouter);

const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  console.error("🔥 BACKEND ERROR:", error);

  if (error instanceof ValidationError) {
    return response.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error instanceof DuplicateEmailError) {
    return response.status(409).json({
      success: false,
      message: error.message,
    });
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  ) {
    return response.status(409).json({
      success: false,
      message: "Duplicate value already exists",
    });
  }

  return response.status(500).json({
    success: false,
    message: error instanceof Error
      ? error.message
      : "Internal server error",
  });
};

app.use(errorHandler);

export default app;