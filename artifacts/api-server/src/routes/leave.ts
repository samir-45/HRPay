import { Router } from "express";
import { db } from "@workspace/db";
import { leaveRequestsTable, leaveBalancesTable, employeesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListLeaveRequestsQueryParams,
  CreateLeaveRequestBody,
  ApproveLeaveRequestParams,
  RejectLeaveRequestParams,
  ListLeaveBalancesQueryParams,
} from "@workspace/api-zod";
import { notify } from "../lib/notify";
import { requireNonEmployee } from "../lib/auth-helpers";

const router = Router();

router.get("/leave/requests", async (req, res) => {
  const { employeeId, status, type } = ListLeaveRequestsQueryParams.parse(req.query);
  const conditions = [];
  if (employeeId) conditions.push(eq(leaveRequestsTable.employeeId, employeeId));
  if (status) conditions.push(eq(leaveRequestsTable.status, status));
  if (type) conditions.push(eq(leaveRequestsTable.type, type));

  const requests = await db
    .select({
      id: leaveRequestsTable.id,
      employeeId: leaveRequestsTable.employeeId,
      employeeName: employeesTable.firstName,
      employeeLastName: employeesTable.lastName,
      type: leaveRequestsTable.type,
      startDate: leaveRequestsTable.startDate,
      endDate: leaveRequestsTable.endDate,
      days: leaveRequestsTable.days,
      reason: leaveRequestsTable.reason,
      status: leaveRequestsTable.status,
      reviewedBy: leaveRequestsTable.reviewedBy,
      reviewedAt: leaveRequestsTable.reviewedAt,
      createdAt: leaveRequestsTable.createdAt,
    })
    .from(leaveRequestsTable)
    .leftJoin(employeesTable, eq(leaveRequestsTable.employeeId, employeesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(leaveRequestsTable.createdAt);

  res.json(
    requests.map((r) => ({
      ...r,
      employeeName: `${r.employeeName ?? ""} ${r.employeeLastName ?? ""}`.trim(),
      days: r.days ? Number(r.days) : null,
    }))
  );
});

router.post("/leave/requests", async (req, res) => {
  const body = CreateLeaveRequestBody.parse(req.body);
  const start = new Date(body.startDate);
  const end = new Date(body.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const [request] = await db
    .insert(leaveRequestsTable)
    .values({ ...body, days: days.toString() })
    .returning();

  const [emp] = await db
    .select({ firstName: employeesTable.firstName, lastName: employeesTable.lastName })
    .from(employeesTable)
    .where(eq(employeesTable.id, body.employeeId));
  const empName = emp ? `${emp.firstName} ${emp.lastName}` : "An employee";
  await notify(
    "New Leave Request",
    `${empName} submitted a ${body.type} leave request for ${days} day${days !== 1 ? "s" : ""} (${body.startDate} – ${body.endDate}).`,
    "info"
  );

  res.status(201).json({ ...request, days: Number(request.days) });
});

router.post("/leave/requests/:id/approve", async (req, res) => {
  if (!requireNonEmployee(req, res)) return;
  const { id } = ApproveLeaveRequestParams.parse({ id: Number(req.params.id) });
  const [updated] = await db
    .update(leaveRequestsTable)
    .set({ status: "approved", reviewedBy: "HR Admin", reviewedAt: new Date() })
    .where(eq(leaveRequestsTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });

  const [emp] = await db
    .select({ firstName: employeesTable.firstName, lastName: employeesTable.lastName })
    .from(employeesTable)
    .where(eq(employeesTable.id, updated.employeeId));
  const empName = emp ? `${emp.firstName} ${emp.lastName}` : "Employee";
  await notify(
    "Leave Request Approved",
    `${empName}'s ${updated.type} leave request (${updated.startDate} – ${updated.endDate}) has been approved.`,
    "success"
  );

  res.json({ ...updated, days: Number(updated.days) });
});

router.post("/leave/requests/:id/reject", async (req, res) => {
  if (!requireNonEmployee(req, res)) return;
  const { id } = RejectLeaveRequestParams.parse({ id: Number(req.params.id) });
  const [updated] = await db
    .update(leaveRequestsTable)
    .set({ status: "rejected", reviewedBy: "HR Admin", reviewedAt: new Date() })
    .where(eq(leaveRequestsTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });

  const [emp] = await db
    .select({ firstName: employeesTable.firstName, lastName: employeesTable.lastName })
    .from(employeesTable)
    .where(eq(employeesTable.id, updated.employeeId));
  const empName = emp ? `${emp.firstName} ${emp.lastName}` : "Employee";
  await notify(
    "Leave Request Rejected",
    `${empName}'s ${updated.type} leave request (${updated.startDate} – ${updated.endDate}) has been rejected.`,
    "warning"
  );

  res.json({ ...updated, days: Number(updated.days) });
});

router.get("/leave/balances", async (req, res) => {
  const { employeeId } = ListLeaveBalancesQueryParams.parse(req.query);
  const conditions = employeeId ? [eq(leaveBalancesTable.employeeId, employeeId)] : [];

  const balances = await db
    .select({
      id: leaveBalancesTable.id,
      employeeId: leaveBalancesTable.employeeId,
      employeeName: employeesTable.firstName,
      employeeLastName: employeesTable.lastName,
      type: leaveBalancesTable.type,
      allocated: leaveBalancesTable.allocated,
      used: leaveBalancesTable.used,
      pending: leaveBalancesTable.pending,
      year: leaveBalancesTable.year,
    })
    .from(leaveBalancesTable)
    .leftJoin(employeesTable, eq(leaveBalancesTable.employeeId, employeesTable.id))
    .where(conditions.length > 0 ? conditions[0] : undefined);

  res.json(
    balances.map((b) => ({
      ...b,
      employeeName: `${b.employeeName ?? ""} ${b.employeeLastName ?? ""}`.trim(),
      allocated: Number(b.allocated ?? 0),
      used: Number(b.used ?? 0),
      pending: Number(b.pending ?? 0),
      remaining: Number(b.allocated ?? 0) - Number(b.used ?? 0) - Number(b.pending ?? 0),
    }))
  );
});

export default router;
