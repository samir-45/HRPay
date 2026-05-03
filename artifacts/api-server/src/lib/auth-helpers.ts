import jwt from "jsonwebtoken";
import { Request, Response } from "express";

const JWT_SECRET = process.env["SESSION_SECRET"] ?? "hrpay-secret-dev";

export interface RequestUser {
  id: number;
  email: string;
  name: string;
  role: string;
  companyId: number | null;
}

export function getRequestUser(req: Request): RequestUser | null {
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(auth.slice(7), JWT_SECRET) as RequestUser;
  } catch {
    return null;
  }
}

export function requireNonEmployee(req: Request, res: Response): RequestUser | null {
  const user = getRequestUser(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  if (user.role === "employee") {
    res.status(403).json({ error: "Forbidden: insufficient permissions" });
    return null;
  }
  return user;
}
