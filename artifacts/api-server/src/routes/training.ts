import { Router } from "express";
import { db } from "@workspace/db";
import { coursesTable, enrollmentsTable, employeesTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { getRequestUser, requireCompanyUser, requireNonEmployee } from "../lib/auth-helpers";

const router = Router();

/* ── Courses ── */

router.get("/training/courses", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const cid = user.companyId;
  const conditions = cid ? [eq(coursesTable.companyId, cid)] : [];

  const courses = await db
    .select()
    .from(coursesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(coursesTable.createdAt));

  res.json(courses);
});

router.get("/training/courses/:id", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const cid = user.companyId;
  const courseId = Number(req.params.id);

  const conditions = [eq(coursesTable.id, courseId)];
  if (cid) conditions.push(eq(coursesTable.companyId, cid));

  const [course] = await db.select().from(coursesTable).where(and(...conditions));
  if (!course) { res.status(404).json({ error: "Not found" }); return; }

  const enrolledConditions = [eq(enrollmentsTable.courseId, course.id)];
  if (cid) enrolledConditions.push(eq(employeesTable.companyId, cid));

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
    .where(and(...enrolledConditions));

  res.json({ ...course, enrolled });
});

router.post("/training/courses", async (req, res) => {
  const user = requireCompanyUser(req, res);
  if (!user) return;

  if (!["company_admin", "hr", "manager", "super_admin"].includes(user.role)) {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

  const [course] = await db
    .insert(coursesTable)
    .values({ ...req.body, companyId: user.companyId })
    .returning();
  res.status(201).json(course);
});

router.patch("/training/courses/:id", async (req, res) => {
  const user = requireCompanyUser(req, res);
  if (!user) return;

  if (!["company_admin", "hr", "manager", "super_admin"].includes(user.role)) {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

  const [updated] = await db
    .update(coursesTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(and(eq(coursesTable.id, Number(req.params.id)), eq(coursesTable.companyId, user.companyId)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/training/courses/:id", async (req, res) => {
  const user = requireCompanyUser(req, res);
  if (!user) return;

  if (!["company_admin", "hr", "super_admin"].includes(user.role)) {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

  await db
    .delete(coursesTable)
    .where(and(eq(coursesTable.id, Number(req.params.id)), eq(coursesTable.companyId, user.companyId)));
  res.status(204).send();
});

/* ── Enrollments ── */

router.get("/training/enrollments", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const cid = user.companyId;
  const requestedEmployeeId = req.query["employeeId"] ? Number(req.query["employeeId"]) : undefined;

  /* Employees can only see their own enrollments */
  const effectiveEmployeeId =
    user.role === "employee" && user.employeeId ? user.employeeId : requestedEmployeeId;

  const conditions = [];
  if (effectiveEmployeeId) conditions.push(eq(enrollmentsTable.employeeId, effectiveEmployeeId));
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
  const user = requireNonEmployee(req, res);
  if (!user) return;

  const [enrollment] = await db.insert(enrollmentsTable).values(req.body).returning();
  res.status(201).json(enrollment);
});

router.patch("/training/enrollments/:id", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const [updated] = await db
    .update(enrollmentsTable)
    .set(req.body)
    .where(eq(enrollmentsTable.id, Number(req.params.id)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

export default router;
