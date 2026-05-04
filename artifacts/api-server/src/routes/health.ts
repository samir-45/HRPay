import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/healthz", async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({ status: "ok", db: "ok", timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: "degraded", db: "error", timestamp: new Date().toISOString() });
  }
});

export default router;
