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
import { requireNonEmployee, getRequestUser } from "../lib/auth-helpers";

const router = Router();

router.get("/leave/requests", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { employeeId, status, type } = ListLeaveRequestsQueryParams.parse(req.query);
  const conditions = [];
  if (employeeId) conditions.push(eq(leaveRequestsTable.employeeId, employeeId));
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
  const body = CreateLeaveRequestBody.parse(req.body);
  const start = new Date(body.startDate);
  const end = new Date(body.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const [request] = await db
    .insert(leaveRequestsTable)
    .values({ ...body, days: String(days) })
    .returning();

  await notify(
    "New Leave Request",
    `A new ${body.type} leave request has been submitted for ${days} day(s) starting ${body.startDate}.`,
    "info"
  );

  res.status(201).json({ ...request, days: Number(request.days) });
});

router.post("/leave/requests/:id/approve", async (req, res) => {
  if (!requireNonEmployee(req, res)) return;

  const { id } = ApproveLeaveRequestParams.parse({ id: Number(req.params.id) });
  const { reviewedBy } = req.body as { reviewedBy?: string };
  const [updated] = await db
    .update(leaveRequestsTable)
    .set({ status: "approved", reviewedBy: reviewedBy ?? null, reviewedAt: new Date() })
    .where(eq(leaveRequestsTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });

  await notify("Leave Approved", `Leave request #${id} has been approved.`, "success");
  res.json({ ...updated, days: updated.days ? Number(updated.days) : null });
});

router.post("/leave/requests/:id/reject", async (req, res) => {
  if (!requireNonEmployee(req, res)) return;

  const { id } = RejectLeaveRequestParams.parse({ id: Number(req.params.id) });
  const { reviewedBy } = req.body as { reviewedBy?: string };
  const [updated] = await db
    .update(leaveRequestsTable)
    .set({ status: "rejected", reviewedBy: reviewedBy ?? null, reviewedAt: new Date() })
    .where(eq(leaveRequestsTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });

  await notify("Leave Rejected", `Leave request #${id} has been rejected.`, "warning");
  res.json({ ...updated, days: updated.days ? Number(updated.days) : null });
});

router.get("/leave/balances", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { employeeId } = ListLeaveBalancesQueryParams.parse(req.query);
  const conditions = [];
  if (employeeId) conditions.push(eq(leaveBalancesTable.employeeId, employeeId));

  /* If companyId is set, ensure we only return balances for our company's employees */
  const cid = user.companyId;
  if (cid && !employeeId) {
    const companyEmpIds = await db
      .select({ id: employeesTable.id })
      .from(employeesTable)
      .where(eq(employeesTable.companyId, cid));
    const ids = companyEmpIds.map((e) => e.id);
    if (ids.length === 0) { res.json([]); return; }
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
