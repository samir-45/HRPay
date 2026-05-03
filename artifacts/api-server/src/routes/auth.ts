import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, employeesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env["SESSION_SECRET"] ?? "hrpay-secret-dev";

function signToken(user: { id: number; email: string; name: string; role: string; companyId?: number | null }) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.companyId ?? null },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function getEmployeeId(email: string): Promise<number | null> {
  const [emp] = await db.select({ id: employeesTable.id }).from(employeesTable).where(eq(employeesTable.email, email.toLowerCase()));
  return emp?.id ?? null;
}

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) { res.status(400).json({ error: "Email and password required" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (!user) { res.status(401).json({ error: "Invalid credentials" }); return; }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) { res.status(401).json({ error: "Invalid credentials" }); return; }

  const employeeId = await getEmployeeId(user.email);
  const token = signToken(user);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.companyId ?? null, employeeId } });
});

router.get("/auth/me", async (req, res) => {
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Not authenticated" }); return; }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { id: number; email: string; name: string; role: string; companyId?: number | null };
    const employeeId = await getEmployeeId(payload.email);
    res.json({ id: payload.id, email: payload.email, name: payload.name, role: payload.role, companyId: payload.companyId ?? null, employeeId });
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

router.post("/auth/change-password", async (req, res) => {
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Not authenticated" }); return; }

  let userId: number;
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { id: number };
    userId = payload.id;
  } catch {
    res.status(401).json({ error: "Invalid or expired token" }); return;
  }

  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
  if (!currentPassword || !newPassword) { res.status(400).json({ error: "currentPassword and newPassword are required" }); return; }
  if (newPassword.length < 8) { res.status(400).json({ error: "New password must be at least 8 characters" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) { res.status(400).json({ error: "Current password is incorrect" }); return; }

  const newHash = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, userId));

  res.json({ success: true });
});

export default router;
