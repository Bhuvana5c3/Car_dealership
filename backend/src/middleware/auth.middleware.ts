import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header("Authorization") || req.header("authorization");

  if (!authHeader) {
    return res.status(401).json({ success: false, message: "Missing Authorization header" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ success: false, message: "Malformed Authorization header" });
  }

  const token = parts[1];
  const secret = process.env.JWT_SECRET;

  if (!secret || secret === "YOUR_JWT_SECRET") {
    return res.status(500).json({ success: false, message: "JWT secret not configured" });
  }

  try {
    const payload = jwt.verify(token, secret) as { userId?: string; role?: string; exp?: number };

    if (!payload || !payload.userId) {
      return res.status(401).json({ success: false, message: "Invalid token payload" });
    }

    req.user = { userId: payload.userId as string, role: (payload.role as string) ?? "USER" };

    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}
