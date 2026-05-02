import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env["SESSION_SECRET"] ?? "hrpay-secret-dev";

function signToken(user: { id: number; email: string; name: string; role: string }) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
}

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) { res.status(400).json({ error: "Email and password required" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (!user) { res.status(401).json({ error: "Invalid credentials" }); return; }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) { res.status(401).json({ error: "Invalid credentials" }); return; }

  const token = signToken(user);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

router.post("/auth/register", async (req, res) => {
  const { email, password, name, role = "employee" } = req.body as { email: string; password: string; name: string; role?: string };
  if (!email || !password || !name) { res.status(400).json({ error: "Email, password and name required" }); return; }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (existing) { res.status(409).json({ error: "Email already registered" }); return; }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ email: email.toLowerCase(), passwordHash, name, role }).returning();

  const token = signToken(user);
  res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

router.get("/auth/me", (req, res) => {
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { id: number; email: string; name: string; role: string };
    res.json({ id: payload.id, email: payload.email, name: payload.name, role: payload.role });
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

export default router;
