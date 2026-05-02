import { Router } from "express";
import { db } from "@workspace/db";
import {
  employeesTable,
  departmentsTable,
  payrollRunsTable,
  leaveRequestsTable,
  timeEntriesTable,
  onboardingTasksTable,
} from "@workspace/db";
import { eq, count, sum, gte, and, sql } from "drizzle-orm";
import { GetPayrollTrendsQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/analytics/dashboard", async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [totalRes] = await db.select({ count: count() }).from(employeesTable);
  const [activeRes] = await db
    .select({ count: count() })
    .from(employeesTable)
    .where(eq(employeesTable.status, "active"));
  const [newHiresRes] = await db
    .select({ count: count() })
    .from(employeesTable)
    .where(gte(employeesTable.startDate, startOfMonth.toISOString().split("T")[0]));
  const [terminationsRes] = await db
    .select({ count: count() })
    .from(employeesTable)
    .where(
      and(
        eq(employeesTable.status, "terminated"),
        gte(employeesTable.updatedAt, startOfMonth)
      )
    );
  const [pendingLeaveRes] = await db
    .select({ count: count() })
    .from(leaveRequestsTable)
    .where(eq(leaveRequestsTable.status, "pending"));
  const [pendingTimeRes] = await db
    .select({ count: count() })
    .from(timeEntriesTable)
    .where(eq(timeEntriesTable.status, "pending"));
  const [onboardingRes] = await db
    .select({ count: count() })
    .from(onboardingTasksTable)
    .where(eq(onboardingTasksTable.isCompleted, false));

  const nextPayroll = await db
    .select()
    .from(payrollRunsTable)
    .where(eq(payrollRunsTable.status, "draft"))
    .orderBy(payrollRunsTable.payDate)
    .limit(1);

  const lastCompletedPayroll = await db
    .select()
    .from(payrollRunsTable)
    .where(eq(payrollRunsTable.status, "completed"))
    .orderBy(sql`${payrollRunsTable.processedAt} DESC`)
    .limit(1);

  const ytdPayroll = await db
    .select({ total: sum(payrollRunsTable.totalGrossPay) })
    .from(payrollRunsTable)
    .where(
      and(
        eq(payrollRunsTable.status, "completed"),
        gte(payrollRunsTable.payDate, `${now.getFullYear()}-01-01`)
      )
    );

  res.json({
    totalEmployees: Number(totalRes.count),
    activeEmployees: Number(activeRes.count),
    newHiresThisMonth: Number(newHiresRes.count),
    terminationsThisMonth: Number(terminationsRes.count),
    pendingLeaveRequests: Number(pendingLeaveRes.count),
    pendingTimeEntries: Number(pendingTimeRes.count),
    nextPayrollDate: nextPayroll[0]?.payDate ?? null,
    nextPayrollAmount: null,
    lastPayrollAmount: lastCompletedPayroll[0]
      ? Number(lastCompletedPayroll[0].totalNetPay ?? 0)
      : null,
    totalPayrollYTD: Number(ytdPayroll[0]?.total ?? 0),
    onboardingInProgress: Number(onboardingRes.count),
    openPositions: 0,
  });
});

router.get("/analytics/headcount", async (req, res) => {
  const depts = await db.select().from(departmentsTable);

  const fullTime = await db
    .select({ departmentId: employeesTable.departmentId, count: count() })
    .from(employeesTable)
    .where(and(eq(employeesTable.status, "active"), eq(employeesTable.employmentType, "full_time")))
    .groupBy(employeesTable.departmentId);

  const partTime = await db
    .select({ departmentId: employeesTable.departmentId, count: count() })
    .from(employeesTable)
    .where(and(eq(employeesTable.status, "active"), eq(employeesTable.employmentType, "part_time")))
    .groupBy(employeesTable.departmentId);

  const contractors = await db
    .select({ departmentId: employeesTable.departmentId, count: count() })
    .from(employeesTable)
    .where(
      and(eq(employeesTable.status, "active"), eq(employeesTable.employmentType, "contractor"))
    )
    .groupBy(employeesTable.departmentId);

  const ftMap = new Map(fullTime.map((r) => [r.departmentId, Number(r.count)]));
  const ptMap = new Map(partTime.map((r) => [r.departmentId, Number(r.count)]));
  const cMap = new Map(contractors.map((r) => [r.departmentId, Number(r.count)]));

  const result = depts.map((d) => {
    const ft = ftMap.get(d.id) ?? 0;
    const pt = ptMap.get(d.id) ?? 0;
    const c = cMap.get(d.id) ?? 0;
    return {
      departmentId: d.id,
      departmentName: d.name,
      headCount: ft + pt + c,
      fullTime: ft,
      partTime: pt,
      contractors: c,
    };
  });

  res.json(result);
});

router.get("/analytics/payroll-trends", async (req, res) => {
  const { months } = GetPayrollTrendsQueryParams.parse(req.query);
  const runs = await db
    .select()
    .from(payrollRunsTable)
    .where(eq(payrollRunsTable.status, "completed"))
    .orderBy(payrollRunsTable.payDate);

  const trendMap = new Map<
    string,
    { month: string; year: number; totalGross: number; totalNet: number; totalTaxes: number; employeeCount: number }
  >();

  for (const run of runs) {
    const date = new Date(run.payDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthName = date.toLocaleString("default", { month: "short" });
    const existing = trendMap.get(key) ?? {
      month: monthName,
      year: date.getFullYear(),
      totalGross: 0,
      totalNet: 0,
      totalTaxes: 0,
      employeeCount: 0,
    };
    existing.totalGross += Number(run.totalGrossPay ?? 0);
    existing.totalNet += Number(run.totalNetPay ?? 0);
    existing.totalTaxes += Number(run.totalTaxes ?? 0);
    existing.employeeCount = Math.max(existing.employeeCount, run.employeeCount ?? 0);
    trendMap.set(key, existing);
  }

  const sortedKeys = Array.from(trendMap.keys())
    .sort()
    .slice(-months);

  res.json(sortedKeys.map((k) => trendMap.get(k)!));
});

router.get("/analytics/leave-summary", async (req, res) => {
  const types = ["vacation", "sick", "personal", "maternity", "paternity", "unpaid"];
  const result = [];

  for (const type of types) {
    const all = await db
      .select()
      .from(leaveRequestsTable)
      .where(eq(leaveRequestsTable.type, type));
    if (all.length === 0) continue;
    const totalDays = all.reduce((acc, r) => acc + Number(r.days ?? 0), 0);
    const pending = all.filter((r) => r.status === "pending").length;
    const approved = all.filter((r) => r.status === "approved").length;
    const rejected = all.filter((r) => r.status === "rejected").length;
    result.push({ type, count: all.length, totalDays, pending, approved, rejected });
  }

  res.json(result);
});

router.get("/analytics/upcoming-events", async (req, res) => {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  const employees = await db.select().from(employeesTable).where(eq(employeesTable.status, "active"));

  const events = [];

  for (const emp of employees) {
    const name = `${emp.firstName} ${emp.lastName}`;

    // Work anniversaries
    if (emp.startDate) {
      const start = new Date(emp.startDate);
      const thisYearAnniversary = new Date(now.getFullYear(), start.getMonth(), start.getDate());
      if (thisYearAnniversary >= now && thisYearAnniversary <= nextMonth) {
        const years = now.getFullYear() - start.getFullYear();
        events.push({
          id: `anniversary-${emp.id}`,
          type: "work_anniversary",
          title: `${name}'s Work Anniversary`,
          description: `${years} year${years !== 1 ? "s" : ""} at the company`,
          date: thisYearAnniversary.toISOString().split("T")[0],
          employeeId: emp.id,
          employeeName: name,
        });
      }
    }
  }

  // Upcoming payroll
  const upcomingPayroll = await db
    .select()
    .from(payrollRunsTable)
    .where(and(eq(payrollRunsTable.status, "draft"), gte(payrollRunsTable.payDate, now.toISOString().split("T")[0])))
    .orderBy(payrollRunsTable.payDate)
    .limit(2);

  for (const run of upcomingPayroll) {
    events.push({
      id: `payroll-${run.id}`,
      type: "payroll",
      title: `${run.name} Pay Date`,
      description: `Payroll run for ${run.periodStart} to ${run.periodEnd}`,
      date: run.payDate,
      employeeId: null,
      employeeName: null,
    });
  }

  // Upcoming approved leave
  const upcomingLeave = await db
    .select({
      id: leaveRequestsTable.id,
      employeeId: leaveRequestsTable.employeeId,
      employeeName: employeesTable.firstName,
      employeeLastName: employeesTable.lastName,
      type: leaveRequestsTable.type,
      startDate: leaveRequestsTable.startDate,
    })
    .from(leaveRequestsTable)
    .leftJoin(employeesTable, eq(leaveRequestsTable.employeeId, employeesTable.id))
    .where(
      and(
        eq(leaveRequestsTable.status, "approved"),
        gte(leaveRequestsTable.startDate, now.toISOString().split("T")[0])
      )
    )
    .limit(5);

  for (const leave of upcomingLeave) {
    const name = `${leave.employeeName ?? ""} ${leave.employeeLastName ?? ""}`.trim();
    events.push({
      id: `leave-${leave.id}`,
      type: "leave_start",
      title: `${name} - ${leave.type} leave`,
      description: `Approved ${leave.type} leave starts`,
      date: leave.startDate,
      employeeId: leave.employeeId,
      employeeName: name,
    });
  }

  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  res.json(events.slice(0, 10));
});

export default router;
