import { Router } from "express";
import { db } from "@workspace/db";
import { shiftsTable, shiftAssignmentsTable, employeesTable, departmentsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { getRequestUser, requireNonEmployee } from "../lib/auth-helpers";

const router = Router();

/* GET /api/shifts */
router.get("/shifts", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }
  const cid = user.companyId;
  const shifts = await db.select().from(shiftsTable)
    .where(cid ? eq(shiftsTable.companyId, cid) : undefined)
    .orderBy(shiftsTable.name);
  res.json(shifts);
});

/* POST /api/shifts */
router.post("/shifts", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;
  const { name, startTime, endTime, graceMunites, breakMinutes, workingDays, overtimeThreshold, color } = req.body ?? {};
  if (!name || !startTime || !endTime) { res.status(400).json({ error: "name, startTime, endTime required" }); return; }
  const [shift] = await db.insert(shiftsTable).values({
    name, startTime, endTime,
    graceMunites: graceMunites ?? 10,
    breakMinutes: breakMinutes ?? 60,
    workingDays: workingDays ?? "Mon,Tue,Wed,Thu,Fri",
    overtimeThreshold: overtimeThreshold ?? "8.0",
    color: color ?? "#a3e635",
    companyId: user.companyId,
  }).returning();
  res.status(201).json(shift);
});

/* PUT /api/shifts/:id */
router.put("/shifts/:id", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;
  const id = Number(req.params.id);
  const { name, startTime, endTime, graceMunites, breakMinutes, workingDays, overtimeThreshold, color } = req.body ?? {};
  const [updated] = await db.update(shiftsTable).set({
    name, startTime, endTime, graceMunites, breakMinutes, workingDays, overtimeThreshold, color
  }).where(eq(shiftsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

/* DELETE /api/shifts/:id */
router.delete("/shifts/:id", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;
  const id = Number(req.params.id);
  await db.delete(shiftsTable).where(eq(shiftsTable.id, id));
  res.json({ success: true });
});

/* GET /api/shifts/assignments */
router.get("/shifts/assignments", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }
  const assignments = await db
    .select({
      id: shiftAssignmentsTable.id,
      employeeId: shiftAssignmentsTable.employeeId,
      employeeName: employeesTable.firstName,
      employeeLastName: employeesTable.lastName,
      departmentId: shiftAssignmentsTable.departmentId,
      shiftId: shiftAssignmentsTable.shiftId,
      shiftName: shiftsTable.name,
      shiftColor: shiftsTable.color,
      effectiveFrom: shiftAssignmentsTable.effectiveFrom,
      effectiveTo: shiftAssignmentsTable.effectiveTo,
    })
    .from(shiftAssignmentsTable)
    .leftJoin(employeesTable, eq(shiftAssignmentsTable.employeeId, employeesTable.id))
    .leftJoin(shiftsTable, eq(shiftAssignmentsTable.shiftId, shiftsTable.id))
    .orderBy(desc(shiftAssignmentsTable.createdAt));
  res.json(assignments.map(a => ({
    ...a,
    employeeName: `${a.employeeName ?? ""} ${a.employeeLastName ?? ""}`.trim(),
  })));
});

/* POST /api/shifts/assignments */
router.post("/shifts/assignments", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;
  const { employeeIds, departmentId, shiftId, effectiveFrom, effectiveTo } = req.body ?? {};
  const ids: number[] = Array.isArray(employeeIds) ? employeeIds : [];
  if (ids.length === 0 && !departmentId) { res.status(400).json({ error: "employeeIds or departmentId required" }); return; }
  if (!shiftId) { res.status(400).json({ error: "shiftId required" }); return; }

  let targetIds = ids;
  if (departmentId && ids.length === 0) {
    const emps = await db.select({ id: employeesTable.id }).from(employeesTable)
      .where(and(eq(employeesTable.departmentId, departmentId), user.companyId ? eq(employeesTable.companyId, user.companyId) : undefined));
    targetIds = emps.map(e => e.id);
  }

  const rows = targetIds.map(eid => ({
    employeeId: eid,
    shiftId,
    effectiveFrom: effectiveFrom ?? null,
    effectiveTo: effectiveTo ?? null,
  }));
  if (rows.length === 0) { res.json({ count: 0 }); return; }
  const inserted = await db.insert(shiftAssignmentsTable).values(rows).returning();
  res.status(201).json({ count: inserted.length });
});

/* DELETE /api/shifts/assignments/:id */
router.delete("/shifts/assignments/:id", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;
  await db.delete(shiftAssignmentsTable).where(eq(shiftAssignmentsTable.id, Number(req.params.id)));
  res.json({ success: true });
});

export default router;
