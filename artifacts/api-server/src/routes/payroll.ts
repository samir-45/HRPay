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

const router = Router();

router.get("/payroll/runs", async (req, res) => {
  const { status } = ListPayrollRunsQueryParams.parse(req.query);
  const conditions = [];
  if (status) conditions.push(eq(payrollRunsTable.status, status));
  const runs = await db
    .select()
    .from(payrollRunsTable)
    .where(conditions.length > 0 ? conditions[0] : undefined)
    .orderBy(payrollRunsTable.createdAt);
  res.json(
    runs.map((r) => ({
      ...r,
      totalGrossPay: r.totalGrossPay ? Number(r.totalGrossPay) : 0,
      totalNetPay: r.totalNetPay ? Number(r.totalNetPay) : 0,
      totalTaxes: r.totalTaxes ? Number(r.totalTaxes) : 0,
      totalDeductions: r.totalDeductions ? Number(r.totalDeductions) : 0,
    }))
  );
});

router.post("/payroll/runs", async (req, res) => {
  const body = CreatePayrollRunBody.parse(req.body);
  const [run] = await db.insert(payrollRunsTable).values(body).returning();
  res.status(201).json({
    ...run,
    totalGrossPay: Number(run.totalGrossPay ?? 0),
    totalNetPay: Number(run.totalNetPay ?? 0),
    totalTaxes: Number(run.totalTaxes ?? 0),
    totalDeductions: Number(run.totalDeductions ?? 0),
  });
});

router.get("/payroll/runs/:id", async (req, res) => {
  const { id } = GetPayrollRunParams.parse({ id: Number(req.params.id) });
  const [run] = await db.select().from(payrollRunsTable).where(eq(payrollRunsTable.id, id));
  if (!run) return res.status(404).json({ error: "Not found" });
  res.json({
    ...run,
    totalGrossPay: Number(run.totalGrossPay ?? 0),
    totalNetPay: Number(run.totalNetPay ?? 0),
    totalTaxes: Number(run.totalTaxes ?? 0),
    totalDeductions: Number(run.totalDeductions ?? 0),
  });
});

router.post("/payroll/runs/:id/process", async (req, res) => {
  const { id } = ProcessPayrollRunParams.parse({ id: Number(req.params.id) });
  const [run] = await db.select().from(payrollRunsTable).where(eq(payrollRunsTable.id, id));
  if (!run) return res.status(404).json({ error: "Not found" });

  const employees = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.status, "active"));

  let totalGross = 0;
  let totalNet = 0;
  let totalTaxes = 0;

  const stubs = [];
  for (const emp of employees) {
    const salary = emp.salary ? Number(emp.salary) : 50000;
    const salaryType = emp.salaryType ?? "annual";
    const grossPay = salaryType === "hourly" ? salary * 80 : salary / 26;
    const federalTax = grossPay * 0.22;
    const stateTax = grossPay * 0.05;
    const socialSecurity = grossPay * 0.062;
    const medicare = grossPay * 0.0145;
    const healthInsurance = 200;
    const retirement = grossPay * 0.04;
    const totalDeductions = federalTax + stateTax + socialSecurity + medicare + healthInsurance + retirement;
    const netPay = grossPay - totalDeductions;

    stubs.push({
      payrollRunId: id,
      employeeId: emp.id,
      grossPay: grossPay.toFixed(2),
      netPay: Math.max(netPay, 0).toFixed(2),
      federalTax: federalTax.toFixed(2),
      stateTax: stateTax.toFixed(2),
      socialSecurity: socialSecurity.toFixed(2),
      medicare: medicare.toFixed(2),
      healthInsurance: healthInsurance.toFixed(2),
      retirement: retirement.toFixed(2),
      hoursWorked: "80",
    });

    totalGross += grossPay;
    totalTaxes += federalTax + stateTax + socialSecurity + medicare;
    totalNet += Math.max(netPay, 0);
  }

  if (stubs.length > 0) {
    await db.insert(payStubsTable).values(stubs);
  }

  const [updated] = await db
    .update(payrollRunsTable)
    .set({
      status: "completed",
      processedAt: new Date(),
      totalGrossPay: totalGross.toFixed(2),
      totalNetPay: totalNet.toFixed(2),
      totalTaxes: totalTaxes.toFixed(2),
      totalDeductions: (totalGross - totalNet).toFixed(2),
      employeeCount: employees.length,
    })
    .where(eq(payrollRunsTable.id, id))
    .returning();

  res.json({
    ...updated,
    totalGrossPay: Number(updated.totalGrossPay ?? 0),
    totalNetPay: Number(updated.totalNetPay ?? 0),
    totalTaxes: Number(updated.totalTaxes ?? 0),
    totalDeductions: Number(updated.totalDeductions ?? 0),
  });
});

router.get("/payroll/stubs", async (req, res) => {
  const { employeeId, payrollRunId } = ListPayStubsQueryParams.parse(req.query);

  const stubs = await db
    .select({
      id: payStubsTable.id,
      payrollRunId: payStubsTable.payrollRunId,
      employeeId: payStubsTable.employeeId,
      employeeName: employeesTable.firstName,
      employeeLastName: employeesTable.lastName,
      grossPay: payStubsTable.grossPay,
      netPay: payStubsTable.netPay,
      federalTax: payStubsTable.federalTax,
      stateTax: payStubsTable.stateTax,
      socialSecurity: payStubsTable.socialSecurity,
      medicare: payStubsTable.medicare,
      healthInsurance: payStubsTable.healthInsurance,
      retirement: payStubsTable.retirement,
      hoursWorked: payStubsTable.hoursWorked,
      periodStart: payrollRunsTable.periodStart,
      periodEnd: payrollRunsTable.periodEnd,
      payDate: payrollRunsTable.payDate,
      createdAt: payStubsTable.createdAt,
    })
    .from(payStubsTable)
    .leftJoin(employeesTable, eq(payStubsTable.employeeId, employeesTable.id))
    .leftJoin(payrollRunsTable, eq(payStubsTable.payrollRunId, payrollRunsTable.id))
    .where(
      and(
        employeeId ? eq(payStubsTable.employeeId, employeeId) : undefined,
        payrollRunId ? eq(payStubsTable.payrollRunId, payrollRunId) : undefined
      )
    );

  res.json(
    stubs.map((s) => ({
      ...s,
      employeeName: `${s.employeeName ?? ""} ${s.employeeLastName ?? ""}`.trim(),
      grossPay: Number(s.grossPay ?? 0),
      netPay: Number(s.netPay ?? 0),
      federalTax: Number(s.federalTax ?? 0),
      stateTax: Number(s.stateTax ?? 0),
      socialSecurity: Number(s.socialSecurity ?? 0),
      medicare: Number(s.medicare ?? 0),
      healthInsurance: Number(s.healthInsurance ?? 0),
      retirement: Number(s.retirement ?? 0),
      hoursWorked: Number(s.hoursWorked ?? 0),
    }))
  );
});

export default router;
