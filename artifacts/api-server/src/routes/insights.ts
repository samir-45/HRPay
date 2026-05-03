import { Router } from "express";
import { db } from "@workspace/db";
import {
  companyInsightsTable,
  companiesTable,
  employeesTable,
  payrollRunsTable,
  leaveRequestsTable,
  expenseClaimsTable,
  timeEntriesTable,
  onboardingTasksTable,
  performanceReviewsTable,
} from "@workspace/db";
import { eq, and, gte, desc } from "drizzle-orm";
import { requireCompanyUser, getRequestUser } from "../lib/auth-helpers";
import { openai } from "@workspace/integrations-openai-ai-server";
import { logger } from "../lib/logger";

const router = Router();

interface InsightItem {
  category: string;
  status: "good" | "warning" | "alert" | "info";
  title: string;
  detail: string;
  recommendation: string;
  metric?: string;
}

interface InsightPayload {
  summary: string;
  score: number;
  insights: InsightItem[];
}

async function getCompanySnapshot(companyId: number) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const isoThirty = thirtyDaysAgo.toISOString().slice(0, 10);
  const isoSeven = sevenDaysAgo.toISOString().slice(0, 10);

  const [
    employees,
    payrollRuns,
    leaveRequests,
    expenses,
    timeEntries,
    onboardingTasks,
    performance,
  ] = await Promise.all([
    db.select().from(employeesTable).where(eq(employeesTable.companyId, companyId)),
    db.select().from(payrollRunsTable).where(eq(payrollRunsTable.companyId, companyId)).orderBy(desc(payrollRunsTable.createdAt)).limit(5),
    db.select({
      id: leaveRequestsTable.id,
      type: leaveRequestsTable.type,
      status: leaveRequestsTable.status,
      days: leaveRequestsTable.days,
      startDate: leaveRequestsTable.startDate,
      employeeId: leaveRequestsTable.employeeId,
    }).from(leaveRequestsTable)
      .leftJoin(employeesTable, eq(leaveRequestsTable.employeeId, employeesTable.id))
      .where(and(
        eq(employeesTable.companyId, companyId),
        gte(leaveRequestsTable.startDate, isoThirty)
      )),
    db.select({
      id: expenseClaimsTable.id,
      status: expenseClaimsTable.status,
      amount: expenseClaimsTable.amount,
      category: expenseClaimsTable.category,
    }).from(expenseClaimsTable)
      .leftJoin(employeesTable, eq(expenseClaimsTable.employeeId, employeesTable.id))
      .where(eq(employeesTable.companyId, companyId)),
    db.select({
      id: timeEntriesTable.id,
      status: timeEntriesTable.status,
      hoursWorked: timeEntriesTable.hoursWorked,
      date: timeEntriesTable.date,
    }).from(timeEntriesTable)
      .leftJoin(employeesTable, eq(timeEntriesTable.employeeId, employeesTable.id))
      .where(and(
        eq(employeesTable.companyId, companyId),
        gte(timeEntriesTable.date, isoSeven)
      )),
    db.select({
      id: onboardingTasksTable.id,
      isCompleted: onboardingTasksTable.isCompleted,
      employeeId: onboardingTasksTable.employeeId,
    }).from(onboardingTasksTable)
      .leftJoin(employeesTable, eq(onboardingTasksTable.employeeId, employeesTable.id))
      .where(eq(employeesTable.companyId, companyId)),
    db.select({
      id: performanceReviewsTable.id,
      status: performanceReviewsTable.status,
      overallRating: performanceReviewsTable.overallRating,
    }).from(performanceReviewsTable)
      .leftJoin(employeesTable, eq(performanceReviewsTable.employeeId, employeesTable.id))
      .where(eq(employeesTable.companyId, companyId)).limit(30),
  ]);

  const active = employees.filter(e => e.status === "active");
  const inactive = employees.filter(e => e.status !== "active");
  const deptCounts: Record<string, number> = {};
  for (const e of active) {
    const key = String(e.departmentId ?? "unassigned");
    deptCounts[key] = (deptCounts[key] ?? 0) + 1;
  }

  const lastPayroll = payrollRuns[0];
  const pendingLeave = leaveRequests.filter(r => r.status === "pending");
  const approvedLeave = leaveRequests.filter(r => r.status === "approved");
  const leaveByType: Record<string, number> = {};
  for (const r of approvedLeave) { leaveByType[r.type] = (leaveByType[r.type] ?? 0) + 1; }

  const pendingExpenses = expenses.filter(e => e.status === "pending");
  const totalPendingExpenseAmount = pendingExpenses.reduce((s, e) => s + Number(e.amount ?? 0), 0);
  const approvedExpenseAmount = expenses.filter(e => e.status === "approved").reduce((s, e) => s + Number(e.amount ?? 0), 0);
  const pendingTimeEntries = timeEntries.filter(e => e.status === "pending");

  const completedOnboarding = onboardingTasks.filter(t => t.isCompleted).length;
  const totalOnboarding = onboardingTasks.length;

  const completedReviews = performance.filter(r => r.status === "completed");
  const avgRating = completedReviews.length
    ? completedReviews.reduce((s, r) => s + Number(r.overallRating ?? 0), 0) / completedReviews.length
    : null;

  return {
    headcount: { total: employees.length, active: active.length, inactive: inactive.length },
    payroll: {
      lastRun: lastPayroll ? {
        name: lastPayroll.name,
        status: lastPayroll.status,
        employeeCount: lastPayroll.employeeCount,
        totalNet: lastPayroll.totalNetPay ? Number(lastPayroll.totalNetPay) : 0,
        totalGross: lastPayroll.totalGrossPay ? Number(lastPayroll.totalGrossPay) : 0,
        processedAt: lastPayroll.processedAt,
      } : null,
      totalRuns: payrollRuns.length,
    },
    leave: {
      pendingCount: pendingLeave.length,
      approvedLast30Days: approvedLeave.length,
      totalDaysTaken: approvedLeave.reduce((s, r) => s + Number(r.days ?? 0), 0),
      byType: leaveByType,
    },
    expenses: {
      pendingCount: pendingExpenses.length,
      pendingAmount: totalPendingExpenseAmount,
      approvedAmount: approvedExpenseAmount,
      totalCount: expenses.length,
    },
    time: {
      pendingApprovals: pendingTimeEntries.length,
      totalEntriesThisWeek: timeEntries.length,
    },
    onboarding: { completed: completedOnboarding, total: totalOnboarding },
    performance: {
      completedReviews: completedReviews.length,
      averageRating: avgRating ? Number(avgRating.toFixed(1)) : null,
    },
  };
}

async function generateInsights(companyId: number, companyName: string): Promise<InsightPayload> {
  const snapshot = await getCompanySnapshot(companyId);

  const prompt = `You are an expert HR analyst. Analyze the following HR & payroll data snapshot for ${companyName} and provide actionable weekly insights and recommendations.

## Company Data Snapshot
${JSON.stringify(snapshot, null, 2)}

## Instructions
Return a JSON object with this exact structure (no markdown, pure JSON):
{
  "summary": "A 2-3 sentence executive summary of the company's overall HR health this week.",
  "score": <number 0-100 representing overall HR health score>,
  "insights": [
    {
      "category": "<one of: Headcount, Payroll, Leave & Time Off, Expenses, Onboarding, Recruitment, Performance, Time & Attendance>",
      "status": "<one of: good, warning, alert, info>",
      "title": "<short punchy title, max 8 words>",
      "detail": "<2-3 sentence analysis of this area based on the data>",
      "recommendation": "<1-2 sentence concrete action recommendation>",
      "metric": "<optional: a key metric like '25 active employees' or '$4,200 pending approval'>"
    }
  ]
}

Rules:
- Always include at least 6 insights covering different categories
- Use "good" for positive/healthy metrics, "warning" for items needing attention, "alert" for urgent issues, "info" for neutral observations
- Be specific and reference actual numbers from the data
- Make recommendations concrete and actionable
- Score below 60 means critical issues, 60-79 needs attention, 80+ is healthy`;

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

  try {
    return JSON.parse(cleaned) as InsightPayload;
  } catch {
    return {
      summary: "Unable to parse AI response. Please try regenerating.",
      score: 50,
      insights: [],
    };
  }
}

/* GET /api/insights — fetch latest + settings */
router.get("/insights", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }
  if (!user.companyId) { res.status(403).json({ error: "No company" }); return; }

  const [company] = await db.select({ settings: companiesTable.settings, name: companiesTable.name })
    .from(companiesTable).where(eq(companiesTable.id, user.companyId));

  const settings = (company?.settings ?? {}) as Record<string, unknown>;
  const enabled = settings.aiInsightsEnabled !== false;

  const [latest] = await db
    .select()
    .from(companyInsightsTable)
    .where(eq(companyInsightsTable.companyId, user.companyId))
    .orderBy(desc(companyInsightsTable.generatedAt))
    .limit(1);

  res.json({ enabled, latest: latest ?? null });
});

/* POST /api/insights/generate — generate now */
router.post("/insights/generate", async (req, res) => {
  const user = requireCompanyUser(req, res);
  if (!user) return;

  const [company] = await db.select({ settings: companiesTable.settings, name: companiesTable.name })
    .from(companiesTable).where(eq(companiesTable.id, user.companyId));

  const settings = (company?.settings ?? {}) as Record<string, unknown>;
  if (settings.aiInsightsEnabled === false) {
    return res.status(403).json({ error: "AI Insights is disabled for this company." });
  }

  const weekOf = getWeekMonday();

  const [placeholder] = await db.insert(companyInsightsTable).values({
    companyId: user.companyId,
    weekOf,
    summary: null,
    score: null,
    insights: null,
    status: "generating",
  }).returning();

  // Generate async — respond immediately with placeholder
  res.json({ id: placeholder.id, status: "generating", weekOf });

  generateInsights(user.companyId, company?.name ?? "Your Company")
    .then(async (payload) => {
      await db.update(companyInsightsTable)
        .set({
          summary: payload.summary,
          score: payload.score,
          insights: payload.insights,
          status: "completed",
          generatedAt: new Date(),
        })
        .where(eq(companyInsightsTable.id, placeholder.id));
    })
    .catch(async (err) => {
      logger.error({ err }, "Insights generation failed");
      await db.update(companyInsightsTable)
        .set({ status: "failed" })
        .where(eq(companyInsightsTable.id, placeholder.id));
    });
});

/* GET /api/insights/:id/poll — poll status of a generating insight */
router.get("/insights/:id/poll", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const id = Number(req.params.id);
  const [insight] = await db.select().from(companyInsightsTable)
    .where(and(eq(companyInsightsTable.id, id), eq(companyInsightsTable.companyId, user.companyId!)));

  if (!insight) return res.status(404).json({ error: "Not found" });
  res.json(insight);
});

/* PATCH /api/insights/settings — toggle enabled */
router.patch("/insights/settings", async (req, res) => {
  const user = requireCompanyUser(req, res);
  if (!user) return;

  const { enabled } = req.body as { enabled: boolean };

  const [company] = await db.select({ settings: companiesTable.settings })
    .from(companiesTable).where(eq(companiesTable.id, user.companyId));

  const existing = (company?.settings ?? {}) as Record<string, unknown>;
  const newSettings = { ...existing, aiInsightsEnabled: Boolean(enabled) };

  await db.update(companiesTable)
    .set({ settings: newSettings, updatedAt: new Date() })
    .where(eq(companiesTable.id, user.companyId));

  res.json({ enabled: Boolean(enabled) });
});

function getWeekMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

export default router;
export { generateInsights, getWeekMonday };
