import { Router } from "express";
import { db } from "@workspace/db";
import { benefitPlansTable, benefitEnrollmentsTable, employeesTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import {
  CreateBenefitPlanBody,
  ListBenefitEnrollmentsQueryParams,
  CreateBenefitEnrollmentBody,
} from "@workspace/api-zod";
import { getRequestUser } from "../lib/auth-helpers";

const router = Router();

router.get("/benefits/plans", async (_req, res) => {
  const plans = await db.select().from(benefitPlansTable);
  const enrollmentCounts = await db
    .select({ planId: benefitEnrollmentsTable.planId, count: count() })
    .from(benefitEnrollmentsTable)
    .where(eq(benefitEnrollmentsTable.isActive, true))
    .groupBy(benefitEnrollmentsTable.planId);

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
  const body = CreateBenefitPlanBody.parse(req.body);
  const [plan] = await db.insert(benefitPlansTable).values(body).returning();
  res.status(201).json({
    ...plan,
    employeeCost: Number(plan.employeeCost ?? 0),
    employerCost: Number(plan.employerCost ?? 0),
    enrolledCount: 0,
  });
});

router.get("/benefits/enrollments", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { employeeId, planId } = ListBenefitEnrollmentsQueryParams.parse(req.query);
  const cid = user.companyId;

  const conditions = [];
  if (employeeId) conditions.push(eq(benefitEnrollmentsTable.employeeId, employeeId));
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
  const body = CreateBenefitEnrollmentBody.parse(req.body);
  const [enrollment] = await db.insert(benefitEnrollmentsTable).values(body).returning();
  res.status(201).json(enrollment);
});

router.delete("/benefits/enrollments/:id", async (req, res) => {
  await db
    .update(benefitEnrollmentsTable)
    .set({ isActive: false })
    .where(eq(benefitEnrollmentsTable.id, Number(req.params.id)));
  res.status(204).send();
});

export default router;
