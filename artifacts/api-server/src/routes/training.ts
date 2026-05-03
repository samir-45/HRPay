import { Router } from "express";
import { db } from "@workspace/db";
import { coursesTable, enrollmentsTable, employeesTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { getRequestUser, requireNonEmployee } from "../lib/auth-helpers";

const router = Router();

router.get("/training/courses", async (_req, res) => {
  const courses = await db.select().from(coursesTable).orderBy(desc(coursesTable.createdAt));
  res.json(courses);
});

router.get("/training/courses/:id", async (req, res) => {
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, Number(req.params.id)));
  if (!course) return res.status(404).json({ error: "Not found" });

  const enrolled = await db
    .select({
      id: enrollmentsTable.id,
      employeeId: enrollmentsTable.employeeId,
      firstName: employeesTable.firstName,
      lastName: employeesTable.lastName,
      status: enrollmentsTable.status,
      progress: enrollmentsTable.progress,
      score: enrollmentsTable.score,
      dueDate: enrollmentsTable.dueDate,
      completedAt: enrollmentsTable.completedAt,
    })
    .from(enrollmentsTable)
    .leftJoin(employeesTable, eq(enrollmentsTable.employeeId, employeesTable.id))
    .where(eq(enrollmentsTable.courseId, course.id));

  res.json({ ...course, enrolled });
});

router.post("/training/courses", async (req, res) => {
  if (!requireNonEmployee(req, res)) return;
  const [course] = await db.insert(coursesTable).values(req.body).returning();
  res.status(201).json(course);
});

router.patch("/training/courses/:id", async (req, res) => {
  if (!requireNonEmployee(req, res)) return;
  const [updated] = await db
    .update(coursesTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(coursesTable.id, Number(req.params.id)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

router.delete("/training/courses/:id", async (req, res) => {
  if (!requireNonEmployee(req, res)) return;
  await db.delete(coursesTable).where(eq(coursesTable.id, Number(req.params.id)));
  res.status(204).send();
});

router.get("/training/enrollments", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const cid = user.companyId;
  const employeeId = req.query["employeeId"] ? Number(req.query["employeeId"]) : undefined;

  const conditions = [];
  if (employeeId) conditions.push(eq(enrollmentsTable.employeeId, employeeId));
  if (cid) conditions.push(eq(employeesTable.companyId, cid));

  const enrollments = await db
    .select({
      id: enrollmentsTable.id,
      employeeId: enrollmentsTable.employeeId,
      firstName: employeesTable.firstName,
      lastName: employeesTable.lastName,
      courseId: enrollmentsTable.courseId,
      courseName: coursesTable.title,
      status: enrollmentsTable.status,
      progress: enrollmentsTable.progress,
      score: enrollmentsTable.score,
      dueDate: enrollmentsTable.dueDate,
      completedAt: enrollmentsTable.completedAt,
    })
    .from(enrollmentsTable)
    .leftJoin(employeesTable, eq(enrollmentsTable.employeeId, employeesTable.id))
    .leftJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(enrollmentsTable.createdAt));

  res.json(
    enrollments.map((e) => ({
      ...e,
      employeeName: `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim(),
    }))
  );
});

router.post("/training/enrollments", async (req, res) => {
  const [enrollment] = await db.insert(enrollmentsTable).values(req.body).returning();
  res.status(201).json(enrollment);
});

router.patch("/training/enrollments/:id", async (req, res) => {
  const [updated] = await db
    .update(enrollmentsTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(enrollmentsTable.id, Number(req.params.id)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

export default router;
