import { Router } from "express";
import { db } from "@workspace/db";
import { goalsTable, performanceReviewsTable, employeesTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { getRequestUser, requireNonEmployee, requireCompanyUser } from "../lib/auth-helpers";

const router = Router();

/* ── Goals ── */

router.get("/performance/goals", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const cid = user.companyId;
  const requestedEmployeeId = req.query["employeeId"] ? Number(req.query["employeeId"]) : undefined;

  /* Employees can only see their own goals */
  const effectiveEmployeeId =
    user.role === "employee" && user.employeeId ? user.employeeId : requestedEmployeeId;

  const conditions = [];
  if (effectiveEmployeeId) conditions.push(eq(goalsTable.employeeId, effectiveEmployeeId));
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
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  /* Employees can only create goals for themselves */
  const body = (req.body ?? {}) as { employeeId?: number; [key: string]: unknown };
  if (user.role === "employee" && user.employeeId && body.employeeId && body.employeeId !== user.employeeId) {
    res.status(403).json({ error: "Cannot create goals for another employee" });
    return;
  }

  const { employeeId, title, description, category, target, progress, status, dueDate, cycle } = body;
  if (!employeeId || !title) {
    res.status(400).json({ error: "employeeId and title are required" });
    return;
  }

  const [goal] = await db
    .insert(goalsTable)
    .values({ employeeId: Number(employeeId), title: String(title), description: description ? String(description) : undefined, category: category ? String(category) : "individual", target: target ? String(target) : undefined, progress: progress ? Number(progress) : 0, status: status ? String(status) : "active", dueDate: dueDate ? String(dueDate) : undefined, cycle: cycle ? String(cycle) : undefined })
    .returning();
  res.status(201).json(goal);
});

router.patch("/performance/goals/:id", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const id = Number(req.params.id);
  const cid = user.companyId;

  /* Verify ownership if employee, or company if non-employee */
  const [existing] = await db
    .select({ employeeId: goalsTable.employeeId, companyId: employeesTable.companyId })
    .from(goalsTable)
    .leftJoin(employeesTable, eq(goalsTable.employeeId, employeesTable.id))
    .where(eq(goalsTable.id, id));

  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (cid && existing.companyId !== cid) { res.status(403).json({ error: "Forbidden" }); return; }
  if (user.role === "employee" && user.employeeId && existing.employeeId !== user.employeeId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const [updated] = await db
    .update(goalsTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(goalsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/performance/goals/:id", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;

  const id = Number(req.params.id);
  if (user.companyId) {
    const [existing] = await db
      .select({ companyId: employeesTable.companyId })
      .from(goalsTable)
      .leftJoin(employeesTable, eq(goalsTable.employeeId, employeesTable.id))
      .where(eq(goalsTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (existing.companyId !== user.companyId) { res.status(403).json({ error: "Forbidden" }); return; }
  }

  await db.delete(goalsTable).where(eq(goalsTable.id, id));
  res.status(204).send();
});

/* ── Performance Reviews ── */

router.get("/performance/reviews", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const cid = user.companyId;
  const requestedEmployeeId = req.query["employeeId"] ? Number(req.query["employeeId"]) : undefined;

  /* Employees can only see their own reviews */
  const effectiveEmployeeId =
    user.role === "employee" && user.employeeId ? user.employeeId : requestedEmployeeId;

  const conditions = [];
  if (effectiveEmployeeId) conditions.push(eq(performanceReviewsTable.employeeId, effectiveEmployeeId));
  if (cid) conditions.push(eq(employeesTable.companyId, cid));

  const reviews = await db
    .select({
      id: performanceReviewsTable.id,
      employeeId: performanceReviewsTable.employeeId,
      employeeName: employeesTable.firstName,
      employeeLastName: employeesTable.lastName,
      reviewerId: performanceReviewsTable.reviewerId,
      cycle: performanceReviewsTable.cycle,
      period: performanceReviewsTable.period,
      overallScore: performanceReviewsTable.overallRating,
      status: performanceReviewsTable.status,
      reviewDate: performanceReviewsTable.reviewDate,
      strengths: performanceReviewsTable.strengths,
      improvements: performanceReviewsTable.improvements,
      comments: performanceReviewsTable.comments,
      selfReview: performanceReviewsTable.selfReview,
      managerFeedback: performanceReviewsTable.managerFeedback,
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
  const user = requireCompanyUser(req, res);
  if (!user) return;

  if (user.role === "employee") {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

  const {
    employeeId, reviewerId, cycle, period, overallRating, status,
    selfReview, managerFeedback, peerFeedback, strengths, improvements, comments, reviewDate,
  } = (req.body ?? {}) as Record<string, unknown>;

  if (!employeeId || !cycle || !period) {
    res.status(400).json({ error: "employeeId, cycle, and period are required" });
    return;
  }

  const [review] = await db
    .insert(performanceReviewsTable)
    .values({
      employeeId: Number(employeeId),
      reviewerId: reviewerId ? Number(reviewerId) : undefined,
      cycle: String(cycle),
      period: String(period),
      overallRating: overallRating ? String(overallRating) : undefined,
      status: status ? String(status) : "pending",
      selfReview: selfReview ? String(selfReview) : undefined,
      managerFeedback: managerFeedback ? String(managerFeedback) : undefined,
      peerFeedback: peerFeedback ? String(peerFeedback) : undefined,
      strengths: strengths ? String(strengths) : undefined,
      improvements: improvements ? String(improvements) : undefined,
      comments: comments ? String(comments) : undefined,
      reviewDate: reviewDate ? String(reviewDate) : undefined,
    })
    .returning();
  res.status(201).json(review);
});

router.patch("/performance/reviews/:id", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;

  const id = Number(req.params.id);
  if (user.companyId) {
    const [existing] = await db
      .select({ companyId: employeesTable.companyId })
      .from(performanceReviewsTable)
      .leftJoin(employeesTable, eq(performanceReviewsTable.employeeId, employeesTable.id))
      .where(eq(performanceReviewsTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (existing.companyId !== user.companyId) { res.status(403).json({ error: "Forbidden" }); return; }
  }

  const [updated] = await db
    .update(performanceReviewsTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(performanceReviewsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

export default router;
