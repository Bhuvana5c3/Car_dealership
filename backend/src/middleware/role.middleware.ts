import type { Request, Response, NextFunction } from "express";

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthenticated" });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    return next();
  };
}
