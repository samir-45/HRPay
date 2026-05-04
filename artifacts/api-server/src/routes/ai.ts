import { Router } from "express";
import { db, employeesTable, leaveRequestsTable, payrollRunsTable, departmentsTable, onboardingTasksTable } from "@workspace/db";
import { getRequestUser } from "../lib/auth-helpers";
import { count, and, eq, desc } from "drizzle-orm";

const router = Router();

const SYSTEM_PROMPT = `You are an expert HR & Payroll assistant for HRPay.
You have deep knowledge of the HRPay platform features:
1. **Employees**: Manage staff, view profiles, and organizational hierarchy.
2. **Payroll**: Process monthly runs, view pay stubs, and manage tax settings.
3. **Time & Attendance**: Track hours, manage shifts, and approve timesheets.
4. **Leave Management**: Approve vacation/sick leave and view team availability.
5. **Onboarding**: Set up tasks for new hires and track progress.
6. **Recruitment**: Applicant Tracking System (ATS) with Kanban board for job candidates.
7. **Performance**: Quartery/Annual reviews, OKRs, and 360-degree feedback.
8. **Benefits**: Manage health insurance, retirement plans, and cost contributions.
9. **Expenses**: Track employee reimbursements and corporate spend.
10. **Assets**: Track company equipment (laptops, phones) assigned to staff.
11. **Reports**: Detailed analytics for headcount, payroll trends, and leave.
12. **Training**: Employee training programs, courses, and certifications.
13. **AI Insights**: Intelligent analysis of HR data and workforce trends.
14. **Settings**: Manage company profile, branding, and user roles.

When given context data about the company, use it to give specific, data-driven answers.
If the user asks "How do I..." or "Where is...", guide them to the correct page listed above.`;

router.post("/ai/chat", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { message, page, contextData } = req.body as {
    message: string;
    page?: string;
    contextData?: Record<string, unknown>;
  };

  if (!message) { res.status(400).json({ error: "Message required" }); return; }

  const cid = user.companyId;

  /* Build company-specific context from DB */
  const [empRes] = await db.select({ count: count() }).from(employeesTable).where(eq(employeesTable.companyId, cid!));
  const depts = await db.select().from(departmentsTable).where(eq(departmentsTable.companyId, cid!));
  
  const pendingLeave = await db
    .select()
    .from(leaveRequestsTable)
    .leftJoin(employeesTable, eq(leaveRequestsTable.employeeId, employeesTable.id))
    .where(and(eq(leaveRequestsTable.status, "pending"), eq(employeesTable.companyId, cid!)));

  const recentPayroll = await db
    .select()
    .from(payrollRunsTable)
    .where(eq(payrollRunsTable.companyId, cid!))
    .orderBy(desc(payrollRunsTable.createdAt))
    .limit(3);

  const [onboardingRes] = await db
    .select({ count: count() })
    .from(onboardingTasksTable)
    .leftJoin(employeesTable, eq(onboardingTasksTable.employeeId, employeesTable.id))
    .where(and(eq(onboardingTasksTable.isCompleted, false), eq(employeesTable.companyId, cid!)));

  const dbContext = `
Current HR Data Snapshot for Company:
- Total Employees: ${empRes.count}
- Departments: ${depts.map(d => d.name).join(", ")}
- Pending leave requests: ${pendingLeave.length}
- Recent payroll runs: ${recentPayroll.map(r => `${r.name}: ${r.periodStart} (${r.status}, gross: $${r.totalGrossPay})`).join(", ")}
- Onboarding tasks in progress: ${onboardingRes.count}
- Current page: ${page ?? "unknown"}
${contextData ? `\nPage context: ${JSON.stringify(contextData)}` : ""}`;

  /* Try Replit AI proxy (OpenAI-compatible) */
  const apiKey = process.env["OPENAI_API_KEY"] ?? process.env["REPLIT_AI_KEY"];

  if (apiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT + "\n" + dbContext },
            { role: "user", content: message },
          ],
          max_tokens: 500,
        }),
      });
      const data = await response.json() as { choices?: { message?: { content?: string } }[] };
      const reply = data.choices?.[0]?.message?.content;
      if (reply) { res.json({ reply }); return; }
    } catch { /* fall through to local response */ }
  }

  /* Intelligent rule-based fallback (works without any API key) */
  const lower = message.toLowerCase();
  let reply = "";

  if (lower.includes("leave") || lower.includes("vacation") || lower.includes("sick")) {
    reply = `There are currently **${pendingLeave.length} pending leave requests** awaiting approval. To manage them, go to the Leave Management page. Leave types include Annual, Sick, Casual, Maternity/Paternity, and Unpaid leave. Approvals trigger automatic email notifications to employees.`;
  } else if (lower.includes("payroll") || lower.includes("salary") || lower.includes("pay")) {
    const latest = recentPayroll[0];
    reply = latest
      ? `The most recent payroll run was for the period **${latest.periodStart} – ${latest.periodEnd}** with a total gross of **$${Number(latest.totalGrossPay ?? 0).toLocaleString()}** (status: ${latest.status}). To process payroll, go to the Payroll page and click "Process Run" on any draft payroll run.`
      : "No payroll runs found. Create a payroll run from the Payroll page.";
  } else if (lower.includes("employee") || lower.includes("hire") || lower.includes("staff") || lower.includes("headcount")) {
    reply = `Use the **Employees** page to manage your workforce. You can add employees, view profiles, track employment history, and manage documents. Use the Onboarding page to set up tasks for new hires. The Departments page shows headcount by team.`;
  } else if (lower.includes("performance") || lower.includes("review") || lower.includes("goal") || lower.includes("okr")) {
    reply = `The **Performance** page allows you to set individual and team goals, run quarterly/annual review cycles, and capture 360-degree feedback. Track goal progress as a percentage and link performance ratings to compensation decisions.`;
  } else if (lower.includes("recruit") || lower.includes("job") || lower.includes("hire") || lower.includes("candidate") || lower.includes("interview")) {
    reply = `The **Recruitment** page has a full ATS (Applicant Tracking System) with a Kanban board. Create job postings, move candidates through stages (Applied → Screening → Interview → Offer → Hired/Rejected), and track time-to-hire metrics.`;
  } else if (lower.includes("report") || lower.includes("analytics") || lower.includes("data") || lower.includes("export")) {
    reply = `The **Reports** page provides pre-built reports: Headcount Report, Payroll Summary, Leave Report, and Attendance Register. Each report shows summary stats and a detailed data table you can filter and export.`;
  } else if (lower.includes("benefit") || lower.includes("insurance") || lower.includes("health")) {
    reply = `The **Benefits** page manages employee benefits plans including health, dental, vision, and retirement. View employer vs. employee cost contributions, and manage enrollment for each employee.`;
  } else if (lower.includes("attendance") || lower.includes("time") || lower.includes("hours") || lower.includes("overtime")) {
    reply = `The **Time & Attendance** page tracks hours worked, overtime, and check-in/out records. Pending entries need manager approval. You can approve multiple entries at once using the bulk approval banner.`;
  } else if (lower.includes("hello") || lower.includes("hi") || lower.includes("help")) {
    reply = `Hello! I'm your HRPay AI assistant. I can help you with:\n\n• **Leave & Time** management\n• **Payroll** processing and analysis\n• **Recruitment** and hiring\n• **Performance** reviews and goals\n• **Reports** and analytics\n• **Employee** management\n\nWhat would you like to know?`;
  } else {
    reply = `I'm your HRPay AI assistant. I can help with payroll processing, leave management, recruitment, performance reviews, headcount analytics, and more. Could you be more specific about what you need? For example: "How do I process payroll?" or "Show me pending leave requests."`;
  }

  res.json({ reply });
});

export default router;
