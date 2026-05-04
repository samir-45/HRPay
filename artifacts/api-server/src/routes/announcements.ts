import { Router } from "express";
import { db } from "@workspace/db";
import { announcementsTable, employeesTable, departmentsTable } from "@workspace/db";
import { eq, desc, and, or, isNull } from "drizzle-orm";
import { requireNonEmployee, getRequestUser } from "../lib/auth-helpers";

const router = Router();

router.get("/announcements", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const baseConditions = [
    or(eq(announcementsTable.companyId, user.companyId!), isNull(announcementsTable.companyId))
  ];

  // If employee, filter by target (all, or their specific department)
  if (user.role === "employee" && user.employeeId) {
    const [employee] = await db
      .select({ deptName: departmentsTable.name })
      .from(employeesTable)
      .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
      .where(eq(employeesTable.id, user.employeeId));

    const targets = ["all"];
    if (employee?.deptName) targets.push(employee.deptName.toLowerCase());
    
    // Also include role-based targets like "hr", "management" if applicable
    // For now, just "all" and department name
    baseConditions.push(or(...targets.map(t => eq(announcementsTable.target, t))));
  }

  const rows = await db
    .select()
    .from(announcementsTable)
    .where(and(...baseConditions))
    .orderBy(desc(announcementsTable.isPinned), desc(announcementsTable.createdAt));
    
  res.json(rows);
});

router.post("/announcements", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;

  const data = { ...req.body };
  if (user.companyId) data.companyId = user.companyId;

  const [row] = await db.insert(announcementsTable).values(data).returning();
  res.status(201).json(row);
});

router.patch("/announcements/:id", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;

  const conditions = [eq(announcementsTable.id, Number(req.params["id"]))];
  if (user.companyId) conditions.push(eq(announcementsTable.companyId, user.companyId));

  const [row] = await db
    .update(announcementsTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(and(...conditions))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/announcements/:id", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;

  const conditions = [eq(announcementsTable.id, Number(req.params["id"]))];
  if (user.companyId) conditions.push(eq(announcementsTable.companyId, user.companyId));

  await db.delete(announcementsTable).where(and(...conditions));
  res.status(204).send();
});

export default router;
