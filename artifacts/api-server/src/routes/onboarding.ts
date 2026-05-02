import { Router } from "express";
import { db } from "@workspace/db";
import { onboardingTasksTable, employeesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListOnboardingTasksQueryParams,
  CreateOnboardingTaskBody,
  CompleteOnboardingTaskParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/onboarding/tasks", async (req, res) => {
  const { employeeId } = ListOnboardingTasksQueryParams.parse(req.query);
  const conditions = employeeId ? [eq(onboardingTasksTable.employeeId, employeeId)] : [];

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
    .where(conditions.length > 0 ? conditions[0] : undefined)
    .orderBy(onboardingTasksTable.createdAt);

  res.json(
    tasks.map((t) => ({
      ...t,
      employeeName: `${t.employeeName ?? ""} ${t.employeeLastName ?? ""}`.trim(),
    }))
  );
});

router.post("/onboarding/tasks", async (req, res) => {
  const body = CreateOnboardingTaskBody.parse(req.body);
  const [task] = await db.insert(onboardingTasksTable).values(body).returning();
  res.status(201).json(task);
});

router.post("/onboarding/tasks/:id/complete", async (req, res) => {
  const { id } = CompleteOnboardingTaskParams.parse({ id: Number(req.params.id) });
  const [updated] = await db
    .update(onboardingTasksTable)
    .set({ isCompleted: true, completedAt: new Date() })
    .where(eq(onboardingTasksTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

export default router;
