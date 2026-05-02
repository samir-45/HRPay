import { Router } from "express";
import { db } from "@workspace/db";
import { timeEntriesTable, employeesTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import {
  ListTimeEntriesQueryParams,
  CreateTimeEntryBody,
  ApproveTimeEntryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/time/entries", async (req, res) => {
  const { employeeId, startDate, endDate, status } = ListTimeEntriesQueryParams.parse(req.query);

  const conditions = [];
  if (employeeId) conditions.push(eq(timeEntriesTable.employeeId, employeeId));
  if (status) conditions.push(eq(timeEntriesTable.status, status));
  if (startDate) conditions.push(gte(timeEntriesTable.date, startDate));
  if (endDate) conditions.push(lte(timeEntriesTable.date, endDate));

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
    .leftJoin(employeesTable, eq(timeEntriesTable.employeeId, employeesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(timeEntriesTable.date);

  res.json(
    entries.map((e) => ({
      ...e,
      employeeName: `${e.employeeName ?? ""} ${e.employeeLastName ?? ""}`.trim(),
      hoursWorked: e.hoursWorked ? Number(e.hoursWorked) : null,
      overtimeHours: e.overtimeHours ? Number(e.overtimeHours) : 0,
    }))
  );
});

router.post("/time/entries", async (req, res) => {
  const body = CreateTimeEntryBody.parse(req.body);

  let hoursWorked: string | undefined;
  if (body.clockIn && body.clockOut) {
    const diffMs = new Date(body.clockOut).getTime() - new Date(body.clockIn).getTime();
    hoursWorked = (diffMs / 3600000).toFixed(2);
  }

  const [entry] = await db
    .insert(timeEntriesTable)
    .values({ ...body, hoursWorked })
    .returning();
  res.status(201).json({ ...entry, hoursWorked: entry.hoursWorked ? Number(entry.hoursWorked) : null });
});

router.post("/time/entries/:id/approve", async (req, res) => {
  const { id } = ApproveTimeEntryParams.parse({ id: Number(req.params.id) });
  const [updated] = await db
    .update(timeEntriesTable)
    .set({ status: "approved" })
    .where(eq(timeEntriesTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json({ ...updated, hoursWorked: updated.hoursWorked ? Number(updated.hoursWorked) : null });
});

export default router;
