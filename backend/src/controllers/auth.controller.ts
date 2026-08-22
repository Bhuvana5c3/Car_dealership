import type { NextFunction, Request, Response } from "express";

import {
  InvalidCredentialsError,
  loginUser,
  registerUser,
} from "../services/auth.service.js";

export async function register(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const user = await registerUser(request.body);

    return response.status(201).json({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    return next(error);
  }
}

export async function login(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const token = await loginUser(request.body);

    return response.status(200).json({
      token,
    });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return response.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    return next(error);
  }
}

export async function me(request: Request, response: Response) {
  // `authenticateJWT` middleware will attach `request.user`
  if (!request.user) {
    return response.status(401).json({ success: false, message: "Unauthenticated" });
  }

  const { userId } = request.user;

  // fetch fresh user details without exposing passwordHash
  const { prisma } = await import("../config/prisma.js");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true } });

  if (!user) return response.status(404).json({ success: false, message: "User not found" });

  return response.json({ success: true, user });
}