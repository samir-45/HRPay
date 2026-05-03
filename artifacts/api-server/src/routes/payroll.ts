import { Router } from "express";
import { db } from "@workspace/db";
import {
  payrollRunsTable,
  payStubsTable,
  employeesTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListPayrollRunsQueryParams,
  CreatePayrollRunBody,
  GetPayrollRunParams,
  ProcessPayrollRunParams,
  ListPayStubsQueryParams,
} from "@workspace/api-zod";
import { notify } from "../lib/notify";
import { requireCompanyUser, getRequestUser } from "../lib/auth-helpers";

const router = Router();

function mapRun(r: typeof payrollRunsTable.$inferSelect) {
  return {
    ...r,
    totalGrossPay: r.totalGrossPay ? Number(r.totalGrossPay) : 0,
    totalNetPay: r.totalNetPay ? Number(r.totalNetPay) : 0,
    totalTaxes: r.totalTaxes ? Number(r.totalTaxes) : 0,
    totalDeductions: r.totalDeductions ? Number(r.totalDeductions) : 0,
  };
}

router.get("/payroll/runs", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { status } = ListPayrollRunsQueryParams.parse(req.query);
  const conditions = [];
  if (user.companyId) conditions.push(eq(payrollRunsTable.companyId, user.companyId));
  if (status) conditions.push(eq(payrollRunsTable.status, status));

  const runs = await db
    .select()
    .from(payrollRunsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(payrollRunsTable.createdAt);

  res.json(runs.map(mapRun));
});

router.post("/payroll/runs", async (req, res) => {
  const user = requireCompanyUser(req, res);
  if (!user) return;

  const body = CreatePayrollRunBody.parse(req.body);
  const [run] = await db
    .insert(payrollRunsTable)
    .values({ ...body, companyId: user.companyId })
    .returning();

  await notify(
    "Payroll Run Created",
    `A new payroll run "${run.name}" has been created for the period ${run.periodStart} – ${run.periodEnd} (pay date: ${run.payDate}).`,
    "info",
    "System",
    user.companyId
  );

  res.status(201).json(mapRun(run));
});

router.get("/payroll/runs/:id", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { id } = GetPayrollRunParams.parse({ id: Number(req.params.id) });
  const conditions = [eq(payrollRunsTable.id, id)];
  if (user.companyId) conditions.push(eq(payrollRunsTable.companyId, user.companyId));

  const [run] = await db.select().from(payrollRunsTable).where(and(...conditions));
  if (!run) return res.status(404).json({ error: "Not found" });
  res.json(mapRun(run));
});

router.post("/payroll/runs/:id/process", async (req, res) => {
  const user = requireCompanyUser(req, res);
  if (!user) return;

  const { id } = ProcessPayrollRunParams.parse({ id: Number(req.params.id) });
  const conditions = [eq(payrollRunsTable.id, id)];
  if (user.companyId) conditions.push(eq(payrollRunsTable.companyId, user.companyId));

  const [run] = await db.select().from(payrollRunsTable).where(and(...conditions));
  if (!run) return res.status(404).json({ error: "Not found" });
  if (run.status !== "draft") return res.status(400).json({ error: "Payroll run already processed" });

  const empConditions = [eq(employeesTable.status, "active")];
  if (user.companyId) empConditions.push(eq(employeesTable.companyId, user.companyId));
  const employees = await db.select().from(employeesTable).where(and(...empConditions));

  let totalGross = 0;
  let totalNet = 0;
  let totalTaxes = 0;
  const stubs = [];

  for (const emp of employees) {
    const annualSalary = Number(emp.salary ?? 0);
    const payPeriods = emp.salaryType === "hourly" ? 1 : 26;
    const gross = annualSalary / payPeriods;
    const federal = gross * 0.22;
    const ss = gross * 0.062;
    const medicare = gross * 0.0145;
    const state = gross * 0.05;
    const health = 150;
    const retirement = gross * 0.03;
    const deductions = health + retirement;
    const taxes = federal + ss + medicare + state;
    const net = gross - taxes - deductions;

    totalGross += gross;
    totalNet += net;
    totalTaxes += taxes;

    stubs.push({
      payrollRunId: id,
      employeeId: emp.id,
      grossPay: gross.toFixed(2),
      netPay: net.toFixed(2),
      federalTax: federal.toFixed(2),
      stateTax: state.toFixed(2),
      socialSecurity: ss.toFixed(2),
      medicare: medicare.toFixed(2),
      healthInsurance: health.toFixed(2),
      retirement: retirement.toFixed(2),
    });
  }

  if (stubs.length > 0) {
    await db.insert(payStubsTable).values(stubs);
  }

  const [processed] = await db
    .update(payrollRunsTable)
    .set({
      status: "completed",
      totalGrossPay: totalGross.toFixed(2),
      totalNetPay: totalNet.toFixed(2),
      totalTaxes: totalTaxes.toFixed(2),
      totalDeductions: (totalGross - totalNet - totalTaxes).toFixed(2),
      employeeCount: employees.length,
      processedAt: new Date(),
    })
    .where(and(...conditions))
    .returning();

  await notify(
    "Payroll Processed",
    `Payroll run "${run.name}" has been successfully processed for ${employees.length} employee(s). Total net pay: $${totalNet.toFixed(2)}.`,
    "success",
    "System",
    user.companyId
  );

  res.json(mapRun(processed));
});

router.get("/payroll/stubs", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { employeeId, payrollRunId } = ListPayStubsQueryParams.parse(req.query);

  /* Employees can only view their own pay stubs */
  const effectiveEmployeeId =
    user.role === "employee" && user.employeeId ? user.employeeId : employeeId;

  const conditions = [];
  if (effectiveEmployeeId) conditions.push(eq(payStubsTable.employeeId, effectiveEmployeeId));
  if (payrollRunId) conditions.push(eq(payStubsTable.payrollRunId, payrollRunId));

  /* Company scoping via payroll run */
  if (user.companyId && !effectiveEmployeeId) {
    conditions.push(eq(payrollRunsTable.companyId, user.companyId));
  }

  /* Always scope stubs to company via payroll run join when user has a company */
  const stubs = user.companyId
    ? await db
        .select({
          id: payStubsTable.id,
          payrollRunId: payStubsTable.payrollRunId,
          employeeId: payStubsTable.employeeId,
          grossPay: payStubsTable.grossPay,
          netPay: payStubsTable.netPay,
          federalTax: payStubsTable.federalTax,
          stateTax: payStubsTable.stateTax,
          socialSecurity: payStubsTable.socialSecurity,
          medicare: payStubsTable.medicare,
          healthInsurance: payStubsTable.healthInsurance,
          retirement: payStubsTable.retirement,
          hoursWorked: payStubsTable.hoursWorked,
          createdAt: payStubsTable.createdAt,
        })
        .from(payStubsTable)
        .innerJoin(payrollRunsTable, and(
          eq(payStubsTable.payrollRunId, payrollRunsTable.id),
          eq(payrollRunsTable.companyId, user.companyId)
        ))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(payStubsTable.createdAt)
    : await db
        .select()
        .from(payStubsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(payStubsTable.createdAt);

  res.json(
    stubs.map((s) => ({
      ...s,
      grossPay: Number(s.grossPay),
      netPay: Number(s.netPay),
      federalTax: Number(s.federalTax ?? 0),
      stateTax: Number(s.stateTax ?? 0),
      socialSecurity: Number(s.socialSecurity ?? 0),
      medicare: Number(s.medicare ?? 0),
      healthInsurance: Number(s.healthInsurance ?? 0),
      retirement: Number(s.retirement ?? 0),
      hoursWorked: s.hoursWorked ? Number(s.hoursWorked) : null,
    }))
  );
});

export default router;
