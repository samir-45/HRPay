import { Router } from "express";
import { db } from "@workspace/db";
import { benefitPlansTable, benefitEnrollmentsTable, employeesTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import {
  CreateBenefitPlanBody,
  ListBenefitEnrollmentsQueryParams,
  CreateBenefitEnrollmentBody,
} from "@workspace/api-zod";
import { getRequestUser, requireCompanyUser, requireNonEmployee } from "../lib/auth-helpers";

const router = Router();

/* ── Benefit Plans ── */

router.get("/benefits/plans", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const cid = user.companyId;
  const conditions = cid ? [eq(benefitPlansTable.companyId, cid)] : [];

  const plans = await db
    .select()
    .from(benefitPlansTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const planIds = plans.map((p) => p.id);
  const enrollmentCounts =
    planIds.length > 0
      ? await db
          .select({ planId: benefitEnrollmentsTable.planId, count: count() })
          .from(benefitEnrollmentsTable)
          .where(eq(benefitEnrollmentsTable.isActive, true))
          .groupBy(benefitEnrollmentsTable.planId)
      : [];

  const countMap = new Map(enrollmentCounts.map((e) => [e.planId, Number(e.count)]));

  res.json(
    plans.map((p) => ({
      ...p,
      employeeCost: Number(p.employeeCost ?? 0),
      employerCost: Number(p.employerCost ?? 0),
      enrolledCount: countMap.get(p.id) ?? 0,
    }))
  );
});

router.post("/benefits/plans", async (req, res) => {
  const user = requireCompanyUser(req, res);
  if (!user) return;

  const body = CreateBenefitPlanBody.parse(req.body);
  const [plan] = await db
    .insert(benefitPlansTable)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .values({ ...body, companyId: user.companyId, employeeCost: body.employeeCost != null ? String(body.employeeCost) : undefined, employerCost: body.employerCost != null ? String(body.employerCost) : undefined } as any)
    .returning();

  res.status(201).json({
    ...plan,
    employeeCost: Number(plan.employeeCost ?? 0),
    employerCost: Number(plan.employerCost ?? 0),
    enrolledCount: 0,
  });
});

router.patch("/benefits/plans/:id", async (req, res) => {
  const user = requireCompanyUser(req, res);
  if (!user) return;

  const id = Number(req.params.id);
  const [updated] = await db
    .update(benefitPlansTable)
    .set(req.body)
    .where(and(eq(benefitPlansTable.id, id), eq(benefitPlansTable.companyId, user.companyId)))
    .returning();

  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({
    ...updated,
    employeeCost: Number(updated.employeeCost ?? 0),
    employerCost: Number(updated.employerCost ?? 0),
  });
});

router.delete("/benefits/plans/:id", async (req, res) => {
  const user = requireCompanyUser(req, res);
  if (!user) return;

  const id = Number(req.params.id);
  await db
    .delete(benefitPlansTable)
    .where(and(eq(benefitPlansTable.id, id), eq(benefitPlansTable.companyId, user.companyId)));
  res.status(204).send();
});

/* ── Benefit Enrollments ── */

router.get("/benefits/enrollments", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { employeeId, planId } = ListBenefitEnrollmentsQueryParams.parse(req.query);
  const cid = user.companyId;

  /* Employees can only see their own enrollments */
  const effectiveEmployeeId =
    user.role === "employee" && user.employeeId ? user.employeeId : employeeId;

  const conditions = [];
  if (effectiveEmployeeId) conditions.push(eq(benefitEnrollmentsTable.employeeId, effectiveEmployeeId));
  if (planId) conditions.push(eq(benefitEnrollmentsTable.planId, planId));
  if (cid) conditions.push(eq(employeesTable.companyId, cid));

  const enrollments = await db
    .select({
      id: benefitEnrollmentsTable.id,
      employeeId: benefitEnrollmentsTable.employeeId,
      employeeName: employeesTable.firstName,
      employeeLastName: employeesTable.lastName,
      planId: benefitEnrollmentsTable.planId,
      planName: benefitPlansTable.name,
      enrolledAt: benefitEnrollmentsTable.enrolledAt,
      isActive: benefitEnrollmentsTable.isActive,
    })
    .from(benefitEnrollmentsTable)
    .leftJoin(employeesTable, eq(benefitEnrollmentsTable.employeeId, employeesTable.id))
    .leftJoin(benefitPlansTable, eq(benefitEnrollmentsTable.planId, benefitPlansTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(benefitEnrollmentsTable.enrolledAt);

  res.json(
    enrollments.map((e) => ({
      ...e,
      employeeName: `${e.employeeName ?? ""} ${e.employeeLastName ?? ""}`.trim(),
    }))
  );
});

router.post("/benefits/enrollments", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const body = CreateBenefitEnrollmentBody.parse(req.body);
  
  // Verify employee belongs to user's company
  if (user.companyId) {
    const emp = await db.query.employeesTable.findFirst({ where: (e) => eq(e.id, body.employeeId) });
    if (!emp || emp.companyId !== user.companyId) { res.status(403).json({ error: "Forbidden" }); return; }
  }

  const [enrollment] = await db.insert(benefitEnrollmentsTable).values(body).returning();
  res.status(201).json(enrollment);
});

router.delete("/benefits/enrollments/:id", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;

  await db
    .update(benefitEnrollmentsTable)
    .set({ isActive: false })
    .where(eq(benefitEnrollmentsTable.id, Number(req.params.id)));
  res.status(204).send();
});

export default router;
