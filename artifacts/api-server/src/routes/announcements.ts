import { Router } from "express";
import { db } from "@workspace/db";
import { announcementsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/announcements", async (_req, res) => {
  const rows = await db.select().from(announcementsTable).orderBy(desc(announcementsTable.createdAt));
  res.json(rows);
});

router.post("/announcements", async (req, res) => {
  const [row] = await db.insert(announcementsTable).values(req.body).returning();
  res.status(201).json(row);
});

router.patch("/announcements/:id", async (req, res) => {
  const [row] = await db.update(announcementsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(announcementsTable.id, Number(req.params["id"]))).returning();
  res.json(row);
});

router.delete("/announcements/:id", async (req, res) => {
  await db.delete(announcementsTable).where(eq(announcementsTable.id, Number(req.params["id"])));
  res.status(204).send();
});

export default router;
