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
import { getRequestUser } from "../lib/auth-helpers";

const router = Router();

router.get("/analytics/dashboard", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const cid = user.companyId;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const empBase = cid ? and(eq(employeesTable.companyId, cid)) : undefined;
  const empActive = cid
    ? and(eq(employeesTable.companyId, cid), eq(employeesTable.status, "active"))
    : eq(employeesTable.status, "active");
  const empNewHires = cid
    ? and(eq(employeesTable.companyId, cid), gte(employeesTable.startDate, startOfMonth.toISOString().split("T")[0]))
    : gte(employeesTable.startDate, startOfMonth.toISOString().split("T")[0]);
  const empTerminated = cid
    ? and(eq(employeesTable.companyId, cid), eq(employeesTable.status, "terminated"), gte(employeesTable.updatedAt, startOfMonth))
    : and(eq(employeesTable.status, "terminated"), gte(employeesTable.updatedAt, startOfMonth));

  const payBase = cid ? and(eq(payrollRunsTable.companyId, cid)) : undefined;
  const payCompleted = cid
    ? and(eq(payrollRunsTable.companyId, cid), eq(payrollRunsTable.status, "completed"))
    : eq(payrollRunsTable.status, "completed");
  const payDraft = cid
    ? and(eq(payrollRunsTable.companyId, cid), eq(payrollRunsTable.status, "draft"))
    : eq(payrollRunsTable.status, "draft");

  const [totalRes] = await db.select({ count: count() }).from(employeesTable).where(empBase);
  const [activeRes] = await db.select({ count: count() }).from(employeesTable).where(empActive);
  const [newHiresRes] = await db.select({ count: count() }).from(employeesTable).where(empNewHires);
  const [terminationsRes] = await db.select({ count: count() }).from(employeesTable).where(empTerminated);

  /* leave pending — scope via employee join */
  const pendingLeaveQuery = db
    .select({ count: count() })
    .from(leaveRequestsTable)
    .where(eq(leaveRequestsTable.status, "pending"));
  const pendingLeaveCompanyQuery = cid
    ? db
        .select({ count: count() })
        .from(leaveRequestsTable)
        .leftJoin(employeesTable, eq(leaveRequestsTable.employeeId, employeesTable.id))
        .where(and(eq(leaveRequestsTable.status, "pending"), eq(employeesTable.companyId, cid)))
    : pendingLeaveQuery;
  const [pendingLeaveRes] = await pendingLeaveCompanyQuery;

  /* time entries pending — scope via employee join */
  const pendingTimeQuery = db
    .select({ count: count() })
    .from(timeEntriesTable)
    .where(eq(timeEntriesTable.status, "pending"));
  const pendingTimeCompanyQuery = cid
    ? db
        .select({ count: count() })
        .from(timeEntriesTable)
        .leftJoin(employeesTable, eq(timeEntriesTable.employeeId, employeesTable.id))
        .where(and(eq(timeEntriesTable.status, "pending"), eq(employeesTable.companyId, cid)))
    : pendingTimeQuery;
  const [pendingTimeRes] = await pendingTimeCompanyQuery;

  /* onboarding */
  const onboardingQuery = cid
    ? db
        .select({ count: count() })
        .from(onboardingTasksTable)
        .leftJoin(employeesTable, eq(onboardingTasksTable.employeeId, employeesTable.id))
        .where(and(eq(onboardingTasksTable.isCompleted, false), eq(employeesTable.companyId, cid)))
    : db.select({ count: count() }).from(onboardingTasksTable).where(eq(onboardingTasksTable.isCompleted, false));
  const [onboardingRes] = await onboardingQuery;

  const nextPayroll = await db
    .select()
    .from(payrollRunsTable)
    .where(payDraft)
    .orderBy(payrollRunsTable.payDate)
    .limit(1);

  const lastCompletedPayroll = await db
    .select()
    .from(payrollRunsTable)
    .where(payCompleted)
    .orderBy(sql`${payrollRunsTable.processedAt} DESC`)
    .limit(1);

  const ytdPayroll = await db
    .select({ total: sum(payrollRunsTable.totalGrossPay) })
    .from(payrollRunsTable)
    .where(
      cid
        ? and(payCompleted, gte(payrollRunsTable.payDate, `${now.getFullYear()}-01-01`))
        : and(eq(payrollRunsTable.status, "completed"), gte(payrollRunsTable.payDate, `${now.getFullYear()}-01-01`))
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
    lastPayrollAmount: lastCompletedPayroll[0] ? Number(lastCompletedPayroll[0].totalNetPay ?? 0) : null,
    totalPayrollYTD: Number(ytdPayroll[0]?.total ?? 0),
    onboardingInProgress: Number(onboardingRes.count),
    openPositions: 0,
  });
});

router.get("/analytics/headcount", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const cid = user.companyId;
  const deptCondition = cid ? and(eq(departmentsTable.companyId, cid)) : undefined;
  const depts = await db.select().from(departmentsTable).where(deptCondition);

  const base = (type: string) =>
    cid
      ? and(eq(employeesTable.companyId, cid), eq(employeesTable.status, "active"), eq(employeesTable.employmentType, type as "full_time"))
      : and(eq(employeesTable.status, "active"), eq(employeesTable.employmentType, type as "full_time"));

  const fullTime = await db
    .select({ departmentId: employeesTable.departmentId, count: count() })
    .from(employeesTable)
    .where(base("full_time"))
    .groupBy(employeesTable.departmentId);

  const partTime = await db
    .select({ departmentId: employeesTable.departmentId, count: count() })
    .from(employeesTable)
    .where(base("part_time"))
    .groupBy(employeesTable.departmentId);

  const contractors = await db
    .select({ departmentId: employeesTable.departmentId, count: count() })
    .from(employeesTable)
    .where(base("contractor"))
    .groupBy(employeesTable.departmentId);

  const ftMap = new Map(fullTime.map((r) => [r.departmentId, Number(r.count)]));
  const ptMap = new Map(partTime.map((r) => [r.departmentId, Number(r.count)]));
  const cMap = new Map(contractors.map((r) => [r.departmentId, Number(r.count)]));

  const result = depts.map((d) => {
    const ft = ftMap.get(d.id) ?? 0;
    const pt = ptMap.get(d.id) ?? 0;
    const c = cMap.get(d.id) ?? 0;
    return { departmentId: d.id, departmentName: d.name, headCount: ft + pt + c, fullTime: ft, partTime: pt, contractors: c };
  });

  res.json(result);
});

router.get("/analytics/payroll-trends", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const cid = user.companyId;
  const { months } = GetPayrollTrendsQueryParams.parse(req.query);
  const runs = await db
    .select()
    .from(payrollRunsTable)
    .where(
      cid
        ? and(eq(payrollRunsTable.companyId, cid), eq(payrollRunsTable.status, "completed"))
        : eq(payrollRunsTable.status, "completed")
    )
    .orderBy(payrollRunsTable.payDate);

  const trendMap = new Map<string, { month: string; year: number; totalGross: number; totalNet: number; totalTaxes: number; employeeCount: number }>();
  for (const run of runs) {
    const date = new Date(run.payDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthName = date.toLocaleString("default", { month: "short" });
    const existing = trendMap.get(key) ?? { month: monthName, year: date.getFullYear(), totalGross: 0, totalNet: 0, totalTaxes: 0, employeeCount: 0 };
    existing.totalGross += Number(run.totalGrossPay ?? 0);
    existing.totalNet += Number(run.totalNetPay ?? 0);
    existing.totalTaxes += Number(run.totalTaxes ?? 0);
    existing.employeeCount = Math.max(existing.employeeCount, run.employeeCount ?? 0);
    trendMap.set(key, existing);
  }

  const sortedKeys = Array.from(trendMap.keys()).sort().slice(-months);
  res.json(sortedKeys.map((k) => trendMap.get(k)!));
});

router.get("/analytics/leave-summary", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const cid = user.companyId;
  const types = ["vacation", "sick", "personal", "maternity", "paternity", "unpaid"];
  const statuses = ["pending", "approved", "rejected"];

  const query = cid
    ? db
        .select({
          type: leaveRequestsTable.type,
          status: leaveRequestsTable.status,
          count: count(),
        })
        .from(leaveRequestsTable)
        .leftJoin(employeesTable, eq(leaveRequestsTable.employeeId, employeesTable.id))
        .where(eq(employeesTable.companyId, cid))
        .groupBy(leaveRequestsTable.type, leaveRequestsTable.status)
    : db
        .select({ type: leaveRequestsTable.type, status: leaveRequestsTable.status, count: count() })
        .from(leaveRequestsTable)
        .groupBy(leaveRequestsTable.type, leaveRequestsTable.status);

  const rows = await query;
  const result = types.map((type) => {
    const byStatus: Record<string, number> = {};
    for (const st of statuses) {
      byStatus[st] = Number(rows.find((r) => r.type === type && r.status === st)?.count ?? 0);
    }
    const count = Object.values(byStatus).reduce((a, b) => a + b, 0);
    return { type, count, ...byStatus };
  });

  res.json(result);
});

router.get("/analytics/time-overview", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const cid = user.companyId;
  const entries = cid
    ? await db
        .select({ hoursWorked: timeEntriesTable.hoursWorked, overtimeHours: timeEntriesTable.overtimeHours, status: timeEntriesTable.status })
        .from(timeEntriesTable)
        .leftJoin(employeesTable, eq(timeEntriesTable.employeeId, employeesTable.id))
        .where(eq(employeesTable.companyId, cid))
    : await db
        .select({ hoursWorked: timeEntriesTable.hoursWorked, overtimeHours: timeEntriesTable.overtimeHours, status: timeEntriesTable.status })
        .from(timeEntriesTable);

  const totalHours = entries.reduce((s, e) => s + Number(e.hoursWorked ?? 0), 0);
  const totalOvertime = entries.reduce((s, e) => s + Number(e.overtimeHours ?? 0), 0);
  const byStatus = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1; return acc;
  }, {});

  res.json({ totalHours, totalOvertime, totalEntries: entries.length, byStatus });
});

router.get("/analytics/upcoming-events", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const cid = user.companyId;
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const leaveQuery = cid
    ? db
        .select({ date: leaveRequestsTable.startDate, title: leaveRequestsTable.type, type: sql.raw(`'leave'`) })
        .from(leaveRequestsTable)
        .leftJoin(employeesTable, eq(leaveRequestsTable.employeeId, employeesTable.id))
        .where(
          and(
            eq(employeesTable.companyId, cid),
            eq(leaveRequestsTable.status, "approved"),
            sql`DATE(${leaveRequestsTable.startDate}) >= ${now.toISOString().split("T")[0]}`,
            sql`DATE(${leaveRequestsTable.startDate}) <= ${thirtyDaysFromNow.toISOString().split("T")[0]}`
          )
        )
    : db
        .select({ date: leaveRequestsTable.startDate, title: leaveRequestsTable.type, type: sql.raw(`'leave'`) })
        .from(leaveRequestsTable)
        .where(
          and(
            eq(leaveRequestsTable.status, "approved"),
            sql`DATE(${leaveRequestsTable.startDate}) >= ${now.toISOString().split("T")[0]}`,
            sql`DATE(${leaveRequestsTable.startDate}) <= ${thirtyDaysFromNow.toISOString().split("T")[0]}`
          )
        );

  const events = await leaveQuery;
  res.json(events || []);
});

export default router;
