import { Router } from "express";
import { db } from "@workspace/db";
import { coursesTable, enrollmentsTable, employeesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireNonEmployee } from "../lib/auth-helpers";

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
    .where(eq(enrollmentsTable.courseId, Number(req.params.id)));

  res.json({ ...course, enrollments: enrolled });
});

router.post("/training/courses", async (req, res) => {
  if (!requireNonEmployee(req, res)) return;
  const { title, description, category, durationHours, instructor, provider, isRequired } = req.body;
  if (!title) return res.status(400).json({ error: "title is required" });
  const [course] = await db.insert(coursesTable).values({
    title, description, category: category ?? "general",
    durationHours: durationHours ? String(durationHours) : "1",
    instructor, provider, isRequired: isRequired ?? false, status: "active",
  }).returning();
  res.status(201).json(course);
});

router.patch("/training/courses/:id", async (req, res) => {
  if (!requireNonEmployee(req, res)) return;
  const { title, description, category, durationHours, instructor, provider, isRequired, status } = req.body;
  const update: Record<string, unknown> = {};
  if (title !== undefined) update.title = title;
  if (description !== undefined) update.description = description;
  if (category !== undefined) update.category = category;
  if (durationHours !== undefined) update.durationHours = String(durationHours);
  if (instructor !== undefined) update.instructor = instructor;
  if (provider !== undefined) update.provider = provider;
  if (isRequired !== undefined) update.isRequired = isRequired;
  if (status !== undefined) update.status = status;
  const [course] = await db.update(coursesTable).set(update).where(eq(coursesTable.id, Number(req.params.id))).returning();
  res.json(course);
});

router.get("/training/enrollments", async (_req, res) => {
  const enrollments = await db
    .select({
      id: enrollmentsTable.id,
      courseId: enrollmentsTable.courseId,
      courseTitle: coursesTable.title,
      courseCategory: coursesTable.category,
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
    .leftJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
    .leftJoin(employeesTable, eq(enrollmentsTable.employeeId, employeesTable.id))
    .orderBy(desc(enrollmentsTable.createdAt));
  res.json(enrollments);
});

router.post("/training/enrollments", async (req, res) => {
  const { courseId, employeeId, dueDate } = req.body;
  if (!courseId || !employeeId) return res.status(400).json({ error: "courseId and employeeId are required" });
  const [enrollment] = await db.insert(enrollmentsTable).values({
    courseId: Number(courseId), employeeId: Number(employeeId),
    dueDate, status: "enrolled", progress: 0,
  }).returning();
  res.status(201).json(enrollment);
});

router.patch("/training/enrollments/:id", async (req, res) => {
  const { status, progress, score } = req.body;
  const update: Record<string, unknown> = {};
  if (status !== undefined) update.status = status;
  if (progress !== undefined) update.progress = Number(progress);
  if (score !== undefined) update.score = String(score);
  if (status === "completed") update.completedAt = new Date();
  const [enrollment] = await db.update(enrollmentsTable).set(update).where(eq(enrollmentsTable.id, Number(req.params.id))).returning();
  res.json(enrollment);
});

export default router;
