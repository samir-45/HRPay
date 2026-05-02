import { Router } from "express";
import { db } from "@workspace/db";
import { jobPostingsTable, applicationsTable, departmentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

/* ─── Job Postings ─── */
router.get("/recruitment/jobs", async (req, res) => {
  const jobs = await db
    .select({
      id: jobPostingsTable.id,
      title: jobPostingsTable.title,
      departmentId: jobPostingsTable.departmentId,
      departmentName: departmentsTable.name,
      description: jobPostingsTable.description,
      type: jobPostingsTable.type,
      location: jobPostingsTable.location,
      salaryMin: jobPostingsTable.salaryMin,
      salaryMax: jobPostingsTable.salaryMax,
      status: jobPostingsTable.status,
      closingDate: jobPostingsTable.closingDate,
      createdAt: jobPostingsTable.createdAt,
    })
    .from(jobPostingsTable)
    .leftJoin(departmentsTable, eq(jobPostingsTable.departmentId, departmentsTable.id))
    .orderBy(desc(jobPostingsTable.createdAt));
  res.json(jobs);
});

router.post("/recruitment/jobs", async (req, res) => {
  const [job] = await db.insert(jobPostingsTable).values(req.body).returning();
  res.status(201).json(job);
});

router.patch("/recruitment/jobs/:id", async (req, res) => {
  const [job] = await db.update(jobPostingsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(jobPostingsTable.id, Number(req.params["id"]))).returning();
  res.json(job);
});

router.delete("/recruitment/jobs/:id", async (req, res) => {
  await db.delete(jobPostingsTable).where(eq(jobPostingsTable.id, Number(req.params["id"])));
  res.status(204).send();
});

/* ─── Applications ─── */
router.get("/recruitment/applications", async (req, res) => {
  const jobId = req.query["jobId"] ? Number(req.query["jobId"]) : undefined;
  let query = db.select().from(applicationsTable).orderBy(desc(applicationsTable.createdAt));
  const apps = await (jobId ? db.select().from(applicationsTable).where(eq(applicationsTable.jobId, jobId)).orderBy(desc(applicationsTable.createdAt)) : query);
  res.json(apps);
});

router.post("/recruitment/applications", async (req, res) => {
  const [app] = await db.insert(applicationsTable).values(req.body).returning();
  res.status(201).json(app);
});

router.patch("/recruitment/applications/:id", async (req, res) => {
  const [app] = await db.update(applicationsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(applicationsTable.id, Number(req.params["id"]))).returning();
  res.json(app);
});

router.delete("/recruitment/applications/:id", async (req, res) => {
  await db.delete(applicationsTable).where(eq(applicationsTable.id, Number(req.params["id"])));
  res.status(204).send();
});

export default router;
