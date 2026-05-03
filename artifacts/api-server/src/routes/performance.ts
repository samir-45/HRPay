import { Router } from "express";
import { db } from "@workspace/db";
import { goalsTable, performanceReviewsTable, employeesTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { getRequestUser, requireNonEmployee } from "../lib/auth-helpers";

const router = Router();

router.get("/performance/goals", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const cid = user.companyId;
  const employeeId = req.query["employeeId"] ? Number(req.query["employeeId"]) : undefined;

  const conditions = [];
  if (employeeId) conditions.push(eq(goalsTable.employeeId, employeeId));
  if (cid) conditions.push(eq(employeesTable.companyId, cid));

  const goals = await db
    .select({
      id: goalsTable.id,
      employeeId: goalsTable.employeeId,
      employeeName: employeesTable.firstName,
      employeeLastName: employeesTable.lastName,
      title: goalsTable.title,
      description: goalsTable.description,
      category: goalsTable.category,
      target: goalsTable.target,
      progress: goalsTable.progress,
      status: goalsTable.status,
      dueDate: goalsTable.dueDate,
      cycle: goalsTable.cycle,
      createdAt: goalsTable.createdAt,
    })
    .from(goalsTable)
    .leftJoin(employeesTable, eq(goalsTable.employeeId, employeesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(goalsTable.createdAt));

  res.json(
    goals.map((g) => ({
      ...g,
      employeeName: `${g.employeeName ?? ""} ${g.employeeLastName ?? ""}`.trim(),
    }))
  );
});

router.post("/performance/goals", async (req, res) => {
  const [goal] = await db.insert(goalsTable).values(req.body).returning();
  res.status(201).json(goal);
});

router.patch("/performance/goals/:id", async (req, res) => {
  const [updated] = await db
    .update(goalsTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(goalsTable.id, Number(req.params.id)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

router.delete("/performance/goals/:id", async (req, res) => {
  if (!requireNonEmployee(req, res)) return;
  await db.delete(goalsTable).where(eq(goalsTable.id, Number(req.params.id)));
  res.status(204).send();
});

router.get("/performance/reviews", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const cid = user.companyId;
  const employeeId = req.query["employeeId"] ? Number(req.query["employeeId"]) : undefined;

  const conditions = [];
  if (employeeId) conditions.push(eq(performanceReviewsTable.employeeId, employeeId));
  if (cid) conditions.push(eq(employeesTable.companyId, cid));

  const reviews = await db
    .select({
      id: performanceReviewsTable.id,
      employeeId: performanceReviewsTable.employeeId,
      employeeName: employeesTable.firstName,
      employeeLastName: employeesTable.lastName,
      reviewerId: performanceReviewsTable.reviewerId,
      cycle: performanceReviewsTable.cycle,
      overallScore: performanceReviewsTable.overallScore,
      status: performanceReviewsTable.status,
      reviewDate: performanceReviewsTable.reviewDate,
      strengths: performanceReviewsTable.strengths,
      improvements: performanceReviewsTable.improvements,
      comments: performanceReviewsTable.comments,
      createdAt: performanceReviewsTable.createdAt,
    })
    .from(performanceReviewsTable)
    .leftJoin(employeesTable, eq(performanceReviewsTable.employeeId, employeesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(performanceReviewsTable.createdAt));

  res.json(
    reviews.map((r) => ({
      ...r,
      employeeName: `${r.employeeName ?? ""} ${r.employeeLastName ?? ""}`.trim(),
      overallScore: r.overallScore ? Number(r.overallScore) : null,
    }))
  );
});

router.post("/performance/reviews", async (req, res) => {
  const [review] = await db.insert(performanceReviewsTable).values(req.body).returning();
  res.status(201).json(review);
});

router.patch("/performance/reviews/:id", async (req, res) => {
  if (!requireNonEmployee(req, res)) return;
  const [updated] = await db
    .update(performanceReviewsTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(performanceReviewsTable.id, Number(req.params.id)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

export default router;
