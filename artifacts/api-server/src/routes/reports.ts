import { Router } from "express";
import { db } from "@workspace/db";
import {
  employeesTable, departmentsTable,
  payrollRunsTable,
  leaveRequestsTable,
  timeEntriesTable,
} from "@workspace/db";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

const router = Router();

/* Headcount report */
router.get("/reports/headcount", async (_req, res) => {
  const employees = await db
    .select({
      id: employeesTable.id,
      firstName: employeesTable.firstName,
      lastName: employeesTable.lastName,
      email: employeesTable.email,
      position: employeesTable.position,
      departmentName: departmentsTable.name,
      employmentType: employeesTable.employmentType,
      status: employeesTable.status,
      startDate: employeesTable.startDate,
      salary: employeesTable.salary,
    })
    .from(employeesTable)
    .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
    .orderBy(departmentsTable.name, employeesTable.lastName);

  const total = employees.length;
  const byStatus = employees.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1; return acc;
  }, {});
  const byType = employees.reduce<Record<string, number>>((acc, e) => {
    acc[e.employmentType] = (acc[e.employmentType] ?? 0) + 1; return acc;
  }, {});
  const byDept = employees.reduce<Record<string, number>>((acc, e) => {
    const d = e.departmentName ?? "Unassigned";
    acc[d] = (acc[d] ?? 0) + 1; return acc;
  }, {});

  res.json({ total, byStatus, byType, byDepartment: byDept, employees });
});

/* Payroll summary report */
router.get("/reports/payroll-summary", async (req, res) => {
  const { from, to } = req.query as { from?: string; to?: string };
  const runs = await db
    .select({
      id: payrollRunsTable.id,
      name: payrollRunsTable.name,
      periodStart: payrollRunsTable.periodStart,
      periodEnd: payrollRunsTable.periodEnd,
      payDate: payrollRunsTable.payDate,
      totalGross: payrollRunsTable.totalGrossPay,
      totalNet: payrollRunsTable.totalNetPay,
      totalTax: payrollRunsTable.totalTaxes,
      employeeCount: payrollRunsTable.employeeCount,
      status: payrollRunsTable.status,
      processedAt: payrollRunsTable.processedAt,
    })
    .from(payrollRunsTable)
    .orderBy(desc(payrollRunsTable.periodStart));

  const totals = runs.reduce((acc, r) => ({
    totalGross: acc.totalGross + Number(r.totalGross ?? 0),
    totalNet: acc.totalNet + Number(r.totalNet ?? 0),
    totalTax: acc.totalTax + Number(r.totalTax ?? 0),
  }), { totalGross: 0, totalNet: 0, totalTax: 0 });

  res.json({ runs, totals });
});

/* Leave report */
router.get("/reports/leave", async (_req, res) => {
  const requests = await db
    .select({
      id: leaveRequestsTable.id,
      employeeId: leaveRequestsTable.employeeId,
      firstName: employeesTable.firstName,
      lastName: employeesTable.lastName,
      departmentName: departmentsTable.name,
      type: leaveRequestsTable.type,
      startDate: leaveRequestsTable.startDate,
      endDate: leaveRequestsTable.endDate,
      days: leaveRequestsTable.days,
      status: leaveRequestsTable.status,
    })
    .from(leaveRequestsTable)
    .leftJoin(employeesTable, eq(leaveRequestsTable.employeeId, employeesTable.id))
    .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
    .orderBy(desc(leaveRequestsTable.createdAt));

  const byType = requests.reduce<Record<string, number>>((acc, r) => {
    acc[r.type] = (acc[r.type] ?? 0) + Number(r.days ?? 1); return acc;
  }, {});
  const byStatus = requests.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1; return acc;
  }, {});

  res.json({ requests, byType, byStatus, total: requests.length });
});

/* Attendance / time report */
router.get("/reports/attendance", async (_req, res) => {
  const entries = await db
    .select({
      id: timeEntriesTable.id,
      employeeId: timeEntriesTable.employeeId,
      firstName: employeesTable.firstName,
      lastName: employeesTable.lastName,
      departmentName: departmentsTable.name,
      date: timeEntriesTable.date,
      hoursWorked: timeEntriesTable.hoursWorked,
      overtimeHours: timeEntriesTable.overtimeHours,
      status: timeEntriesTable.status,
    })
    .from(timeEntriesTable)
    .leftJoin(employeesTable, eq(timeEntriesTable.employeeId, employeesTable.id))
    .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
    .orderBy(desc(timeEntriesTable.date))
    .limit(500);

  const totalHours = entries.reduce((s, e) => s + Number(e.hoursWorked ?? 0), 0);
  const byStatus = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1; return acc;
  }, {});

  res.json({ entries, totalHours, byStatus, total: entries.length });
});

export default router;
