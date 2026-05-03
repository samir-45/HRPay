import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env["SESSION_SECRET"] ?? "hrpay-secret-dev";

export interface RequestUser {
  id: number;
  email: string;
  name: string;
  role: string;
  companyId: number | null;
  employeeId?: number | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

/* ── Token extraction helper ── */
export function getRequestUser(req: Request): RequestUser | null {
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(auth.slice(7), JWT_SECRET) as RequestUser;
  } catch {
    return null;
  }
}

/* ── Middleware: attach user to req (non-blocking, fails silently if no token) ── */
export function attachUser(req: Request, _res: Response, next: NextFunction): void {
  req.user = getRequestUser(req) ?? undefined;
  next();
}

/* ── Guard: require any authenticated user ── */
export function requireAuth(req: Request, res: Response): RequestUser | null {
  const user = getRequestUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return user;
}

/* ── Guard: require auth + company association ── */
export function requireCompanyUser(req: Request, res: Response): (RequestUser & { companyId: number }) | null {
  const user = requireAuth(req, res);
  if (!user) return null;
  if (!user.companyId) {
    res.status(403).json({ error: "Not associated with a company" });
    return null;
  }
  return user as RequestUser & { companyId: number };
}

/* ── Guard: require non-employee role ── */
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

/* ── Guard: require manager or above (company_admin, hr, manager) ── */
export function requireManagerOrAbove(req: Request, res: Response): RequestUser | null {
  const user = getRequestUser(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  const allowed = ["company_admin", "hr", "manager", "super_admin"];
  if (!allowed.includes(user.role)) {
    res.status(403).json({ error: "Manager or above access required" });
    return null;
  }
  return user;
}

/* ── Guard: require specific roles ── */
export function requireRoles(req: Request, res: Response, roles: string[]): RequestUser | null {
  const user = getRequestUser(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  if (!roles.includes(user.role)) {
    res.status(403).json({ error: `Access restricted to: ${roles.join(", ")}` });
    return null;
  }
  return user;
}

/* ── Helper: returns true if user is manager-level or above ── */
export function isManagerOrAbove(role: string): boolean {
  return ["company_admin", "hr", "manager", "super_admin"].includes(role);
}
