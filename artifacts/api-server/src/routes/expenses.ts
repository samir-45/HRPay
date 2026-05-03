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
  const conditions = [];
  if (cid) conditions.push(eq(employeesTable.companyId, cid));

  /* Employees can only see their own expense claims */
  if (user.role === "employee" && user.employeeId) {
    conditions.push(eq(expenseClaimsTable.employeeId, user.employeeId));
  }

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
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(expenseClaimsTable.createdAt));

  res.json(claims.map((c) => ({ ...c, amount: c.amount ? Number(c.amount) : null })));
});

router.get("/expenses/:id", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const cid = user.companyId;
  const id = Number(req.params.id);

  const conditions = [eq(expenseClaimsTable.id, id)];
  if (cid) conditions.push(eq(employeesTable.companyId, cid));

  const [row] = await db
    .select({
      id: expenseClaimsTable.id,
      employeeId: expenseClaimsTable.employeeId,
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
      createdAt: expenseClaimsTable.createdAt,
    })
    .from(expenseClaimsTable)
    .leftJoin(employeesTable, eq(expenseClaimsTable.employeeId, employeesTable.id))
    .where(and(...conditions));

  if (!row) { res.status(404).json({ error: "Not found" }); return; }

  /* Employees can only view their own expenses */
  if (user.role === "employee" && user.employeeId && row.employeeId !== user.employeeId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  res.json({ ...row, amount: row.amount ? Number(row.amount) : null });
});

router.post("/expenses", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const {
    employeeId, title, category, amount, currency, expenseDate, description, receiptUrl,
  } = req.body as {
    employeeId?: number | string; title?: string; category?: string;
    amount?: number | string; currency?: string; expenseDate?: string;
    description?: string; receiptUrl?: string;
  };

  if (!employeeId || !title || !amount || !expenseDate) {
    res.status(400).json({ error: "employeeId, title, amount, expenseDate are required" }); return;
  }

  /* Employees can only submit expenses for themselves */
  if (user.role === "employee" && user.employeeId && Number(employeeId) !== user.employeeId) {
    res.status(403).json({ error: "Cannot submit expenses on behalf of another employee" }); return;
  }

  const [claim] = await db
    .insert(expenseClaimsTable)
    .values({
      employeeId: Number(employeeId),
      title,
      category: category ?? "other",
      amount: String(amount),
      currency: currency ?? "USD",
      expenseDate,
      description,
      receiptUrl,
      status: "pending",
    })
    .returning();

  await notify(
    "Expense Submitted",
    `A new expense claim "${title}" for ${currency ?? "USD"} ${amount} has been submitted.`,
    "info",
    "System",
    user.companyId
  );

  res.status(201).json({ ...claim, amount: claim.amount ? Number(claim.amount) : null });
});

router.patch("/expenses/:id/status", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;

  const { status, reviewNotes, reviewedBy } = (req.body ?? {}) as {
    status?: string; reviewNotes?: string; reviewedBy?: string;
  };
  if (!["approved", "rejected", "pending"].includes(status ?? "")) {
    res.status(400).json({ error: "Invalid status" }); return;
  }

  const id = Number(req.params.id);
  const cid = user.companyId;

  /* Verify the expense belongs to this company */
  const [existing] = await db
    .select({
      title: expenseClaimsTable.title,
      amount: expenseClaimsTable.amount,
      companyId: employeesTable.companyId,
    })
    .from(expenseClaimsTable)
    .leftJoin(employeesTable, eq(expenseClaimsTable.employeeId, employeesTable.id))
    .where(eq(expenseClaimsTable.id, id));

  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (cid && existing.companyId !== cid) { res.status(403).json({ error: "Forbidden" }); return; }

  const [updated] = await db
    .update(expenseClaimsTable)
    .set({
      status: status!,
      reviewNotes: reviewNotes ?? null,
      reviewedBy: reviewedBy ?? null,
      reviewedAt: new Date(),
    })
    .where(eq(expenseClaimsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  if (status === "approved") {
    await notify(
      "Expense Approved",
      `Expense claim "${existing.title}" has been approved.`,
      "success",
      "System",
      user.companyId
    );
  } else if (status === "rejected") {
    await notify(
      "Expense Rejected",
      `Expense claim "${existing.title}" has been rejected${reviewNotes ? `: ${reviewNotes}` : "."}`,
      "warning",
      "System",
      user.companyId
    );
  }

  res.json({ ...updated, amount: updated.amount ? Number(updated.amount) : null });
});

export default router;
