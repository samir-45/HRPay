import { Router } from "express";
import { db } from "@workspace/db";
import { expenseClaimsTable, employeesTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireNonEmployee, getRequestUser } from "../lib/auth-helpers";
import { notify } from "../lib/notify";

const router = Router();

router.get("/expenses", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const cid = user.companyId;
  const claims = await db
    .select({
      id: expenseClaimsTable.id,
      employeeId: expenseClaimsTable.employeeId,
      firstName: employeesTable.firstName,
      lastName: employeesTable.lastName,
      title: expenseClaimsTable.title,
      category: expenseClaimsTable.category,
      amount: expenseClaimsTable.amount,
      currency: expenseClaimsTable.currency,
      expenseDate: expenseClaimsTable.expenseDate,
      description: expenseClaimsTable.description,
      receiptUrl: expenseClaimsTable.receiptUrl,
      status: expenseClaimsTable.status,
      reviewedBy: expenseClaimsTable.reviewedBy,
      reviewNotes: expenseClaimsTable.reviewNotes,
      submittedAt: expenseClaimsTable.submittedAt,
      reviewedAt: expenseClaimsTable.reviewedAt,
    })
    .from(expenseClaimsTable)
    .leftJoin(employeesTable, eq(expenseClaimsTable.employeeId, employeesTable.id))
    .where(cid ? eq(employeesTable.companyId, cid) : undefined)
    .orderBy(desc(expenseClaimsTable.createdAt));

  res.json(claims);
});

router.get("/expenses/:id", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const cid = user.companyId;
  const id = Number(req.params.id);

  const [claim] = cid
    ? await db
        .select({ claim: expenseClaimsTable })
        .from(expenseClaimsTable)
        .leftJoin(employeesTable, eq(expenseClaimsTable.employeeId, employeesTable.id))
        .where(and(eq(expenseClaimsTable.id, id), eq(employeesTable.companyId, cid)))
    : await db.select({ claim: expenseClaimsTable }).from(expenseClaimsTable).where(eq(expenseClaimsTable.id, id));

  if (!claim) return res.status(404).json({ error: "Not found" });
  res.json(claim.claim ?? claim);
});

router.post("/expenses", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { employeeId, title, category, amount, currency, expenseDate, description, receiptUrl } = req.body as {
    employeeId?: number | string; title?: string; category?: string; amount?: number | string;
    currency?: string; expenseDate?: string; description?: string; receiptUrl?: string;
  };

  if (!employeeId || !title || !amount || !expenseDate) {
    return res.status(400).json({ error: "employeeId, title, amount, expenseDate are required" });
  }

  const [claim] = await db.insert(expenseClaimsTable).values({
    employeeId: Number(employeeId), title, category: category ?? "other",
    amount: String(amount), currency: currency ?? "USD",
    expenseDate, description, receiptUrl, status: "pending",
  }).returning();

  await notify(
    "Expense Submitted",
    `A new expense claim "${title}" for ${currency ?? "USD"} ${amount} has been submitted.`,
    "info",
    "System",
    user.companyId
  );

  res.status(201).json(claim);
});

router.patch("/expenses/:id/status", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;

  const { status, reviewNotes, reviewedBy } = req.body as {
    status?: string; reviewNotes?: string; reviewedBy?: string;
  };
  if (!["approved", "rejected", "pending"].includes(status ?? "")) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const [existing] = await db
    .select({ title: expenseClaimsTable.title, amount: expenseClaimsTable.amount })
    .from(expenseClaimsTable)
    .where(eq(expenseClaimsTable.id, Number(req.params.id)));

  const [updated] = await db
    .update(expenseClaimsTable)
    .set({ status: status!, reviewNotes: reviewNotes ?? null, reviewedBy: reviewedBy ?? null, reviewedAt: new Date() })
    .where(eq(expenseClaimsTable.id, Number(req.params.id)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });

  if (status === "approved") {
    await notify(
      "Expense Approved",
      `Expense claim "${existing?.title ?? `#${req.params.id}`}" has been approved.`,
      "success",
      "System",
      user.companyId
    );
  } else if (status === "rejected") {
    await notify(
      "Expense Rejected",
      `Expense claim "${existing?.title ?? `#${req.params.id}`}" has been rejected${reviewNotes ? `: ${reviewNotes}` : "."}`,
      "warning",
      "System",
      user.companyId
    );
  }

  res.json(updated);
});

export default router;
