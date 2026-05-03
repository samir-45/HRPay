import { Router } from "express";
import { db } from "@workspace/db";
import { employeesTable, leaveRequestsTable, payrollRunsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

const SYSTEM_PROMPT = `You are an expert HR & Payroll assistant for HRPay — an enterprise HR management platform. 
You have deep knowledge of HR best practices, payroll processing, labor law, performance management, and employee relations.
You are helpful, concise, and professional. When given context data about the company, use it to give specific, data-driven answers.
If you don't know something, say so clearly. Never make up specific numbers or data not provided.`;

router.post("/ai/chat", async (req, res) => {
  const { message, page, contextData } = req.body as {
    message: string;
    page?: string;
    contextData?: Record<string, unknown>;
  };

  if (!message) { res.status(400).json({ error: "Message required" }); return; }

  /* Build context from DB */
  const [empCount] = await db.select({ count: employeesTable.id }).from(employeesTable).limit(1);
  const pendingLeave = await db.select().from(leaveRequestsTable).where(eq(leaveRequestsTable.status, "pending"));
  const recentPayroll = await db.select().from(payrollRunsTable).orderBy(desc(payrollRunsTable.createdAt)).limit(3);

  const dbContext = `
Current HR Data Snapshot:
- Active employees on system: see employee records
- Pending leave requests: ${pendingLeave.length}
- Recent payroll runs: ${recentPayroll.map(r => `${r.periodStart} (${r.status}, gross: $${r.totalGrossPay})`).join(", ")}
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
