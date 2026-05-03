import { Router } from "express";
import { db } from "@workspace/db";
import { timeEntriesTable, employeesTable } from "@workspace/db";
import { eq, and, gte, lte, inArray, desc } from "drizzle-orm";
import { notify } from "../lib/notify";
import { requireNonEmployee, getRequestUser } from "../lib/auth-helpers";

const router = Router();

/* helpers */
function calcHours(clockIn?: string | null, clockOut?: string | null): number | null {
  if (!clockIn || !clockOut) return null;
  const diffMs = new Date(clockOut).getTime() - new Date(clockIn).getTime();
  return diffMs > 0 ? diffMs / 3600000 : null;
}
function calcOvertime(hours: number | null): number {
  if (!hours || hours <= 8) return 0;
  return Math.round((hours - 8) * 100) / 100;
}
function fmt(entry: { hoursWorked: string | null; overtimeHours: string | null; [k: string]: unknown }) {
  return {
    ...entry,
    hoursWorked: entry.hoursWorked ? Number(entry.hoursWorked) : null,
    overtimeHours: entry.overtimeHours ? Number(entry.overtimeHours) : 0,
  };
}

/* GET /api/time/entries */
router.get("/time/entries", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const q = req.query as Record<string, string>;
  const cid = user.companyId;

  const limit = q.limit ? Number(q.limit) : 200;

  // Build join condition: always match on employeeId; scope to company via join (not WHERE)
  // so that LEFT JOIN doesn't exclude entries whose employee row is missing
  const joinCondition = cid
    ? and(eq(timeEntriesTable.employeeId, employeesTable.id), eq(employeesTable.companyId, cid))
    : eq(timeEntriesTable.employeeId, employeesTable.id);

  const conditions = [];
  if (q.employeeId) conditions.push(eq(timeEntriesTable.employeeId, Number(q.employeeId)));
  if (q.status) conditions.push(eq(timeEntriesTable.status, q.status));
  if (q.startDate) conditions.push(gte(timeEntriesTable.date, q.startDate));
  if (q.endDate) conditions.push(lte(timeEntriesTable.date, q.endDate));
  // Note: company scoping is handled via the joinCondition above (INNER JOIN with company filter)

  const entries = await db
    .select({
      id: timeEntriesTable.id,
      employeeId: timeEntriesTable.employeeId,
      employeeName: employeesTable.firstName,
      employeeLastName: employeesTable.lastName,
      date: timeEntriesTable.date,
      clockIn: timeEntriesTable.clockIn,
      clockOut: timeEntriesTable.clockOut,
      hoursWorked: timeEntriesTable.hoursWorked,
      overtimeHours: timeEntriesTable.overtimeHours,
      notes: timeEntriesTable.notes,
      status: timeEntriesTable.status,
      createdAt: timeEntriesTable.createdAt,
    })
    .from(timeEntriesTable)
    .innerJoin(employeesTable, joinCondition)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(timeEntriesTable.date), desc(timeEntriesTable.createdAt))
    .limit(limit);

  res.json(
    entries.map((e) => ({
      ...e,
      employeeName: `${e.employeeName ?? ""} ${e.employeeLastName ?? ""}`.trim(),
      hoursWorked: e.hoursWorked ? Number(e.hoursWorked) : null,
      overtimeHours: e.overtimeHours ? Number(e.overtimeHours) : 0,
    }))
  );
});

/* POST /api/time/entries */
router.post("/time/entries", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { employeeId, date, clockIn, clockOut, hoursWorked, notes } = req.body as {
    employeeId: number;
    date: string;
    clockIn?: string;
    clockOut?: string;
    hoursWorked?: number;
    notes?: string;
  };

  if (!employeeId || !date) {
    return res.status(400).json({ error: "employeeId and date are required" });
  }

  let computedHours: string | undefined;
  if (clockIn && clockOut) {
    const h = calcHours(clockIn, clockOut);
    if (h !== null) computedHours = h.toFixed(2);
  } else if (hoursWorked) {
    computedHours = hoursWorked.toFixed(2);
  }

  const overtime = computedHours ? calcOvertime(Number(computedHours)).toFixed(2) : "0";

  const [entry] = await db
    .insert(timeEntriesTable)
    .values({
      employeeId,
      date,
      clockIn: clockIn ? new Date(clockIn) : undefined,
      clockOut: clockOut ? new Date(clockOut) : undefined,
      hoursWorked: computedHours,
      overtimeHours: overtime,
      notes: notes ?? undefined,
      status: "pending",
    })
    .returning();

  await notify(
    "Time Entry Submitted",
    `A new time entry has been submitted for ${date} (${computedHours ?? "?"} hrs).`,
    "info",
    "System",
    user.companyId
  );

  res.status(201).json(fmt(entry));
});

/* POST /api/time/entries/bulk-approve */
router.post("/time/entries/bulk-approve", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;

  const { ids } = req.body as { ids: number[] };
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "ids array is required" });
  }

  const updated = await db
    .update(timeEntriesTable)
    .set({ status: "approved" })
    .where(and(inArray(timeEntriesTable.id, ids), eq(timeEntriesTable.status, "pending")))
    .returning();

  await notify(
    "Time Entries Approved",
    `${updated.length} time entries have been bulk approved.`,
    "success",
    "System",
    user.companyId
  );

  res.json({ count: updated.length });
});

/* POST /api/time/entries/:id/approve */
router.post("/time/entries/:id/approve", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;

  const id = Number(req.params.id);
  const [updated] = await db
    .update(timeEntriesTable)
    .set({ status: "approved" })
    .where(eq(timeEntriesTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });

  await notify(
    "Time Entry Approved",
    `Time entry for ${updated.date} (${updated.hoursWorked ?? "?"}h) has been approved.`,
    "success",
    "System",
    user.companyId
  );

  res.json(fmt(updated));
});

/* POST /api/time/entries/:id/reject */
router.post("/time/entries/:id/reject", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;

  const id = Number(req.params.id);
  const [updated] = await db
    .update(timeEntriesTable)
    .set({ status: "rejected" })
    .where(eq(timeEntriesTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });

  await notify(
    "Time Entry Rejected",
    `Time entry for ${updated.date} has been rejected.`,
    "warning",
    "System",
    user.companyId
  );

  res.json(fmt(updated));
});

export default router;
