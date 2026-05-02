import { Router } from "express";
import { db } from "@workspace/db";
import { benefitPlansTable, benefitEnrollmentsTable, employeesTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import {
  CreateBenefitPlanBody,
  ListBenefitEnrollmentsQueryParams,
  CreateBenefitEnrollmentBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/benefits/plans", async (req, res) => {
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
  const { employeeId, planId } = ListBenefitEnrollmentsQueryParams.parse(req.query);
  const conditions = [];
  if (employeeId) conditions.push(eq(benefitEnrollmentsTable.employeeId, employeeId));
  if (planId) conditions.push(eq(benefitEnrollmentsTable.planId, planId));

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
    .where(conditions.length > 0 ? and(...conditions) : undefined);

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

export default router;
