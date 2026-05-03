import { Router } from "express";
import { db } from "@workspace/db";
import { expenseClaimsTable, employeesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireNonEmployee } from "../lib/auth-helpers";

const router = Router();

router.get("/expenses", async (_req, res) => {
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
    .orderBy(desc(expenseClaimsTable.createdAt));
  res.json(claims);
});

router.get("/expenses/:id", async (req, res) => {
  const [claim] = await db
    .select()
    .from(expenseClaimsTable)
    .where(eq(expenseClaimsTable.id, Number(req.params.id)));
  if (!claim) return res.status(404).json({ error: "Not found" });
  res.json(claim);
});

router.post("/expenses", async (req, res) => {
  const { employeeId, title, category, amount, currency, expenseDate, description, receiptUrl } = req.body;
  if (!employeeId || !title || !amount || !expenseDate) {
    return res.status(400).json({ error: "employeeId, title, amount, expenseDate are required" });
  }
  const [claim] = await db.insert(expenseClaimsTable).values({
    employeeId: Number(employeeId), title, category: category ?? "other",
    amount: String(amount), currency: currency ?? "USD",
    expenseDate, description, receiptUrl, status: "pending",
  }).returning();
  res.status(201).json(claim);
});

router.patch("/expenses/:id/status", async (req, res) => {
  if (!requireNonEmployee(req, res)) return;
  const { status, reviewNotes, reviewedBy } = req.body;
  if (!["approved", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ error: "status must be approved, rejected, or pending" });
  }
  const [claim] = await db.update(expenseClaimsTable)
    .set({ status, reviewNotes, reviewedBy, reviewedAt: new Date() })
    .where(eq(expenseClaimsTable.id, Number(req.params.id)))
    .returning();
  res.json(claim);
});

router.delete("/expenses/:id", async (req, res) => {
  if (!requireNonEmployee(req, res)) return;
  await db.delete(expenseClaimsTable).where(eq(expenseClaimsTable.id, Number(req.params.id)));
  res.status(204).end();
});

export default router;
