import { Router } from "express";
import { db } from "@workspace/db";
import { departmentsTable, employeesTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import {
  CreateDepartmentBody,
  UpdateDepartmentParams,
  UpdateDepartmentBody,
  DeleteDepartmentParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/departments", async (req, res) => {
  const depts = await db.select().from(departmentsTable);
  const headcounts = await db
    .select({ departmentId: employeesTable.departmentId, count: count() })
    .from(employeesTable)
    .where(eq(employeesTable.status, "active"))
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
  const body = CreateDepartmentBody.parse(req.body);
  const [dept] = await db.insert(departmentsTable).values(body).returning();
  res.status(201).json({ ...dept, budget: dept.budget ? Number(dept.budget) : null, headCount: 0 });
});

router.put("/departments/:id", async (req, res) => {
  const { id } = UpdateDepartmentParams.parse({ id: Number(req.params.id) });
  const body = UpdateDepartmentBody.parse(req.body);
  const [updated] = await db
    .update(departmentsTable)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(departmentsTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json({ ...updated, budget: updated.budget ? Number(updated.budget) : null, headCount: 0 });
});

router.delete("/departments/:id", async (req, res) => {
  const { id } = DeleteDepartmentParams.parse({ id: Number(req.params.id) });
  await db.delete(departmentsTable).where(eq(departmentsTable.id, id));
  res.status(204).send();
});

export default router;
