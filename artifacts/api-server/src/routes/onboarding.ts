import { Router } from "express";
import { db } from "@workspace/db";
import { onboardingTasksTable, employeesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListOnboardingTasksQueryParams,
  CreateOnboardingTaskBody,
  CompleteOnboardingTaskParams,
} from "@workspace/api-zod";
import { getRequestUser, requireNonEmployee, requireCompanyUser } from "../lib/auth-helpers";

const router = Router();

router.get("/onboarding/tasks", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { employeeId } = ListOnboardingTasksQueryParams.parse(req.query);
  const cid = user.companyId;

  /* Employees can only see their own onboarding tasks */
  const effectiveEmployeeId =
    user.role === "employee" && user.employeeId ? user.employeeId : employeeId;

  const baseConditions = [];
  if (effectiveEmployeeId) baseConditions.push(eq(onboardingTasksTable.employeeId, effectiveEmployeeId));
  if (cid) baseConditions.push(eq(employeesTable.companyId, cid));

  const tasks = await db
    .select({
      id: onboardingTasksTable.id,
      employeeId: onboardingTasksTable.employeeId,
      employeeName: employeesTable.firstName,
      employeeLastName: employeesTable.lastName,
      title: onboardingTasksTable.title,
      description: onboardingTasksTable.description,
      category: onboardingTasksTable.category,
      dueDate: onboardingTasksTable.dueDate,
      completedAt: onboardingTasksTable.completedAt,
      isCompleted: onboardingTasksTable.isCompleted,
      assignedTo: onboardingTasksTable.assignedTo,
      priority: onboardingTasksTable.priority,
      createdAt: onboardingTasksTable.createdAt,
    })
    .from(onboardingTasksTable)
    .leftJoin(employeesTable, eq(onboardingTasksTable.employeeId, employeesTable.id))
    .where(baseConditions.length > 0 ? and(...baseConditions) : undefined)
    .orderBy(onboardingTasksTable.createdAt);

  res.json(
    tasks.map((t) => ({
      ...t,
      employeeName: `${t.employeeName ?? ""} ${t.employeeLastName ?? ""}`.trim(),
    }))
  );
});

router.post("/onboarding/tasks", async (req, res) => {
  const user = requireCompanyUser(req, res);
  if (!user) return;

  if (user.role === "employee") {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

  const body = CreateOnboardingTaskBody.parse(req.body);
  const [task] = await db.insert(onboardingTasksTable).values(body).returning();
  res.status(201).json(task);
});

router.post("/onboarding/tasks/:id/complete", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { id } = CompleteOnboardingTaskParams.parse({ id: Number(req.params.id) });

  /* Verify the task belongs to the requester's company */
  const [task] = await db
    .select({
      id: onboardingTasksTable.id,
      companyId: employeesTable.companyId,
      employeeId: onboardingTasksTable.employeeId,
    })
    .from(onboardingTasksTable)
    .leftJoin(employeesTable, eq(onboardingTasksTable.employeeId, employeesTable.id))
    .where(eq(onboardingTasksTable.id, id));

  if (!task) return res.status(404).json({ error: "Not found" });

  if (user.companyId && task.companyId !== user.companyId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  /* Employees can only complete their own tasks */
  if (user.role === "employee" && user.employeeId && task.employeeId !== user.employeeId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const [updated] = await db
    .update(onboardingTasksTable)
    .set({ isCompleted: true, completedAt: new Date() })
    .where(eq(onboardingTasksTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

router.delete("/onboarding/tasks/:id", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;

  /* Verify the task belongs to the requester's company before deletion */
  if (user.companyId) {
    const [task] = await db
      .select({ companyId: employeesTable.companyId })
      .from(onboardingTasksTable)
      .leftJoin(employeesTable, eq(onboardingTasksTable.employeeId, employeesTable.id))
      .where(eq(onboardingTasksTable.id, Number(req.params.id)));

    if (!task) { res.status(404).json({ error: "Not found" }); return; }
    if (task.companyId !== user.companyId) { res.status(403).json({ error: "Forbidden" }); return; }
  }

  await db.delete(onboardingTasksTable).where(eq(onboardingTasksTable.id, Number(req.params.id)));
  res.status(204).send();
});

export default router;
