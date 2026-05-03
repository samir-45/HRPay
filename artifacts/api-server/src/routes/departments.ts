import { Router } from "express";
import { db } from "@workspace/db";
import { departmentsTable, employeesTable } from "@workspace/db";
import { eq, count, and } from "drizzle-orm";
import {
  CreateDepartmentBody,
  UpdateDepartmentParams,
  UpdateDepartmentBody,
  DeleteDepartmentParams,
} from "@workspace/api-zod";
import { getRequestUser, requireCompanyUser } from "../lib/auth-helpers";

const router = Router();

router.get("/departments", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const conditions = user.companyId ? [eq(departmentsTable.companyId, user.companyId)] : [];

  const depts = await db
    .select()
    .from(departmentsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const empConditions = [eq(employeesTable.status, "active")];
  if (user.companyId) empConditions.push(eq(employeesTable.companyId, user.companyId));

  const headcounts = await db
    .select({ departmentId: employeesTable.departmentId, count: count() })
    .from(employeesTable)
    .where(and(...empConditions))
    .groupBy(employeesTable.departmentId);

  const hcMap = new Map(headcounts.map((h) => [h.departmentId, Number(h.count)]));

  const result = depts.map((d) => ({
    ...d,
    budget: d.budget ? Number(d.budget) : null,
    headCount: hcMap.get(d.id) ?? 0,
  }));
  res.json(result);
});

router.post("/departments", async (req, res) => {
  const user = requireCompanyUser(req, res);
  if (!user) return;

  const body = CreateDepartmentBody.parse(req.body);
  const [dept] = await db
    .insert(departmentsTable)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .values({ ...body, companyId: user.companyId, budget: body.budget != null ? String(body.budget) : undefined } as any)
    .returning();
  res.status(201).json({ ...dept, budget: dept.budget ? Number(dept.budget) : null, headCount: 0 });
});

router.put("/departments/:id", async (req, res) => {
  const user = requireCompanyUser(req, res);
  if (!user) return;

  const { id } = UpdateDepartmentParams.parse({ id: Number(req.params.id) });
  const body = UpdateDepartmentBody.parse(req.body);
  const [updated] = await db
    .update(departmentsTable)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .set({ ...body, budget: body.budget != null ? String(body.budget) : undefined, updatedAt: new Date() } as any)
    .where(and(eq(departmentsTable.id, id), eq(departmentsTable.companyId, user.companyId)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, budget: updated.budget ? Number(updated.budget) : null });
});

router.delete("/departments/:id", async (req, res) => {
  const user = requireCompanyUser(req, res);
  if (!user) return;

  const { id } = DeleteDepartmentParams.parse({ id: Number(req.params.id) });
  await db
    .delete(departmentsTable)
    .where(and(eq(departmentsTable.id, id), eq(departmentsTable.companyId, user.companyId)));
  res.status(204).send();
});

export default router;
