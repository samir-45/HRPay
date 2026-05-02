import { Router } from "express";
import { db } from "@workspace/db";
import { goalsTable, performanceReviewsTable, employeesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

/* ─── Goals ─── */
router.get("/performance/goals", async (req, res) => {
  const employeeId = req.query["employeeId"] ? Number(req.query["employeeId"]) : undefined;
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
    .orderBy(desc(goalsTable.createdAt));

  const filtered = employeeId ? goals.filter(g => g.employeeId === employeeId) : goals;
  res.json(filtered);
});

router.post("/performance/goals", async (req, res) => {
  const [goal] = await db.insert(goalsTable).values(req.body).returning();
  res.status(201).json(goal);
});

router.patch("/performance/goals/:id", async (req, res) => {
  const [goal] = await db.update(goalsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(goalsTable.id, Number(req.params["id"]))).returning();
  res.json(goal);
});

router.delete("/performance/goals/:id", async (req, res) => {
  await db.delete(goalsTable).where(eq(goalsTable.id, Number(req.params["id"])));
  res.status(204).send();
});

/* ─── Performance Reviews ─── */
router.get("/performance/reviews", async (req, res) => {
  const reviews = await db
    .select({
      id: performanceReviewsTable.id,
      employeeId: performanceReviewsTable.employeeId,
      employeeName: employeesTable.firstName,
      employeeLastName: employeesTable.lastName,
      employeePosition: employeesTable.position,
      reviewerId: performanceReviewsTable.reviewerId,
      cycle: performanceReviewsTable.cycle,
      period: performanceReviewsTable.period,
      overallRating: performanceReviewsTable.overallRating,
      status: performanceReviewsTable.status,
      selfReview: performanceReviewsTable.selfReview,
      managerFeedback: performanceReviewsTable.managerFeedback,
      strengths: performanceReviewsTable.strengths,
      improvements: performanceReviewsTable.improvements,
      createdAt: performanceReviewsTable.createdAt,
    })
    .from(performanceReviewsTable)
    .leftJoin(employeesTable, eq(performanceReviewsTable.employeeId, employeesTable.id))
    .orderBy(desc(performanceReviewsTable.createdAt));
  res.json(reviews);
});

router.post("/performance/reviews", async (req, res) => {
  const [review] = await db.insert(performanceReviewsTable).values(req.body).returning();
  res.status(201).json(review);
});

router.patch("/performance/reviews/:id", async (req, res) => {
  const [review] = await db.update(performanceReviewsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(performanceReviewsTable.id, Number(req.params["id"]))).returning();
  res.json(review);
});

export default router;
