import { Router } from "express";
import { db } from "@workspace/db";
import { leaveRequestsTable, leaveBalancesTable, employeesTable } from "@workspace/db";
import { eq, and, sql, inArray } from "drizzle-orm";
import {
  ListLeaveRequestsQueryParams,
  CreateLeaveRequestBody,
  ApproveLeaveRequestParams,
  RejectLeaveRequestParams,
  ListLeaveBalancesQueryParams,
} from "@workspace/api-zod";
import { notify } from "../lib/notify";
import { requireNonEmployee, getRequestUser } from "../lib/auth-helpers";

const router = Router();

router.get("/leave/requests", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { employeeId, status, type } = ListLeaveRequestsQueryParams.parse(req.query);
  const conditions = [];

  /* Employees can only see their own requests */
  const effectiveEmployeeId =
    user.role === "employee" && user.employeeId ? user.employeeId : employeeId;

  if (effectiveEmployeeId) conditions.push(eq(leaveRequestsTable.employeeId, effectiveEmployeeId));
  if (status) conditions.push(eq(leaveRequestsTable.status, status));
  if (type) conditions.push(eq(leaveRequestsTable.type, type));

  const cid = user.companyId;
  if (cid) conditions.push(eq(employeesTable.companyId, cid));

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
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const body = CreateLeaveRequestBody.parse(req.body);

  /* Employees can only submit for themselves */
  if (user.role === "employee" && user.employeeId && body.employeeId !== user.employeeId) {
    res.status(403).json({ error: "Cannot submit leave on behalf of another employee" });
    return;
  }

  const start = new Date(body.startDate);
  const end = new Date(body.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const [request] = await db
    .insert(leaveRequestsTable)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .values({ ...body, startDate: typeof body.startDate === "object" ? (body.startDate as Date).toISOString().split("T")[0] : body.startDate, endDate: typeof body.endDate === "object" ? (body.endDate as Date).toISOString().split("T")[0] : body.endDate, days: String(days) } as any)
    .returning();

  const year = new Date().getFullYear();
  const [existing] = await db
    .select()
    .from(leaveBalancesTable)
    .where(and(
      eq(leaveBalancesTable.employeeId, body.employeeId),
      eq(leaveBalancesTable.type, body.type),
      eq(leaveBalancesTable.year, year)
    ));

  if (existing) {
    await db
      .update(leaveBalancesTable)
      .set({ pending: sql`${leaveBalancesTable.pending} + ${days}` })
      .where(eq(leaveBalancesTable.id, existing.id));
  } else {
    await db.insert(leaveBalancesTable).values({
      employeeId: body.employeeId,
      type: body.type,
      allocated: "14",
      used: "0",
      pending: String(days),
      year,
    });
  }

  await notify(
    "New Leave Request",
    `A new ${body.type} leave request has been submitted for ${days} day(s) starting ${body.startDate}.`,
    "info",
    "System",
    user.companyId
  );

  res.status(201).json({ ...request, days: Number(request.days) });
});

router.post("/leave/requests/:id/approve", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;

  const { id } = ApproveLeaveRequestParams.parse({ id: Number(req.params.id) });
  const { reviewedBy } = req.body as { reviewedBy?: string };

  const [existing] = await db
    .select()
    .from(leaveRequestsTable)
    .where(eq(leaveRequestsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const [updated] = await db
    .update(leaveRequestsTable)
    .set({ status: "approved", reviewedBy: reviewedBy ?? null, reviewedAt: new Date() })
    .where(eq(leaveRequestsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  const year = new Date(existing.startDate).getFullYear();
  const days = existing.days ? Number(existing.days) : 0;
  if (days > 0) {
    await db
      .update(leaveBalancesTable)
      .set({
        pending: sql`GREATEST(0, ${leaveBalancesTable.pending} - ${days})`,
        used: sql`${leaveBalancesTable.used} + ${days}`,
      })
      .where(and(
        eq(leaveBalancesTable.employeeId, existing.employeeId),
        eq(leaveBalancesTable.type, existing.type),
        eq(leaveBalancesTable.year, year)
      ));
  }

  await notify(
    "Leave Approved",
    `Leave request #${id} (${existing.type}, ${days} day(s)) has been approved.`,
    "success",
    "System",
    user.companyId
  );

  res.json({ ...updated, days: updated.days ? Number(updated.days) : null });
});

router.post("/leave/requests/:id/reject", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;

  const { id } = RejectLeaveRequestParams.parse({ id: Number(req.params.id) });
  const { reviewedBy } = req.body as { reviewedBy?: string };

  const [existing] = await db
    .select()
    .from(leaveRequestsTable)
    .where(eq(leaveRequestsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const [updated] = await db
    .update(leaveRequestsTable)
    .set({ status: "rejected", reviewedBy: reviewedBy ?? null, reviewedAt: new Date() })
    .where(eq(leaveRequestsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  const year = new Date(existing.startDate).getFullYear();
  const days = existing.days ? Number(existing.days) : 0;
  if (days > 0) {
    await db
      .update(leaveBalancesTable)
      .set({
        pending: sql`GREATEST(0, ${leaveBalancesTable.pending} - ${days})`,
      })
      .where(and(
        eq(leaveBalancesTable.employeeId, existing.employeeId),
        eq(leaveBalancesTable.type, existing.type),
        eq(leaveBalancesTable.year, year)
      ));
  }

  await notify(
    "Leave Rejected",
    `Leave request #${id} (${existing.type}, ${days} day(s)) has been rejected.`,
    "warning",
    "System",
    user.companyId
  );

  res.json({ ...updated, days: updated.days ? Number(updated.days) : null });
});

router.get("/leave/balances", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { employeeId } = ListLeaveBalancesQueryParams.parse(req.query);

  /* Employees can only see their own balances */
  const effectiveEmployeeId =
    user.role === "employee" && user.employeeId ? user.employeeId : employeeId;

  const conditions = [];
  if (effectiveEmployeeId) {
    conditions.push(eq(leaveBalancesTable.employeeId, effectiveEmployeeId));
  } else {
    /* Scope to company: fetch company employee IDs and use inArray */
    const cid = user.companyId;
    if (cid) {
      const companyEmpRows = await db
        .select({ id: employeesTable.id })
        .from(employeesTable)
        .where(eq(employeesTable.companyId, cid));
      const ids = companyEmpRows.map((e) => e.id);
      if (ids.length === 0) { res.json([]); return; }
      conditions.push(inArray(leaveBalancesTable.employeeId, ids));
    }
  }

  const balances = await db
    .select()
    .from(leaveBalancesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(leaveBalancesTable.type);

  res.json(
    balances.map((b) => ({
      ...b,
      allocated: Number(b.allocated ?? 0),
      used: Number(b.used ?? 0),
      pending: Number(b.pending ?? 0),
      remaining: Number(b.allocated ?? 0) - Number(b.used ?? 0) - Number(b.pending ?? 0),
    }))
  );
});

export default router;
