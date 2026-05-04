import { Router } from "express";
import { db } from "@workspace/db";
import { announcementsTable } from "@workspace/db";
import { eq, desc, and, or, isNull } from "drizzle-orm";
import { requireNonEmployee, getRequestUser } from "../lib/auth-helpers";

const router = Router();

router.get("/announcements", async (req, res) => {
  const user = getRequestUser(req);

  const conditions = user?.companyId
    ? [or(eq(announcementsTable.companyId, user.companyId), isNull(announcementsTable.companyId))]
    : [isNull(announcementsTable.companyId)];

  const rows = await db
    .select()
    .from(announcementsTable)
    .where(conditions[0])
    .orderBy(desc(announcementsTable.createdAt));
  res.json(rows);
});

router.post("/announcements", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;

  const data = { ...req.body };
  if (user.companyId) data.companyId = user.companyId;

  const [row] = await db.insert(announcementsTable).values(data).returning();
  res.status(201).json(row);
});

router.patch("/announcements/:id", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;

  const conditions = [eq(announcementsTable.id, Number(req.params["id"]))];
  if (user.companyId) conditions.push(eq(announcementsTable.companyId, user.companyId));

  const [row] = await db
    .update(announcementsTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(and(...conditions))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/announcements/:id", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;

  const conditions = [eq(announcementsTable.id, Number(req.params["id"]))];
  if (user.companyId) conditions.push(eq(announcementsTable.companyId, user.companyId));

  await db.delete(announcementsTable).where(and(...conditions));
  res.status(204).send();
});

export default router;
