import { Router } from "express";
import { db } from "@workspace/db";
import { jobPostingsTable, applicationsTable, departmentsTable } from "@workspace/db";
import { eq, desc, and, inArray } from "drizzle-orm";
import { getRequestUser, requireNonEmployee } from "../lib/auth-helpers";

const router = Router();

/* ── Job Postings ── */

router.get("/recruitment/jobs", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const cid = user.companyId;
  const conditions = cid ? [eq(departmentsTable.companyId, cid)] : [];

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
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(jobPostingsTable.createdAt));

  res.json(
    jobs.map((j) => ({
      ...j,
      salaryMin: j.salaryMin ? Number(j.salaryMin) : null,
      salaryMax: j.salaryMax ? Number(j.salaryMax) : null,
    }))
  );
});

router.post("/recruitment/jobs", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;

  const [job] = await db.insert(jobPostingsTable).values(req.body).returning();
  res.status(201).json(job);
});

router.patch("/recruitment/jobs/:id", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;

  const id = Number(req.params.id);
  const cid = user.companyId;

  /* Verify the job belongs to caller's company via department */
  if (cid) {
    const [job] = await db
      .select({ companyId: departmentsTable.companyId })
      .from(jobPostingsTable)
      .leftJoin(departmentsTable, eq(jobPostingsTable.departmentId, departmentsTable.id))
      .where(eq(jobPostingsTable.id, id));
    if (!job) { res.status(404).json({ error: "Not found" }); return; }
    if (job.companyId !== cid) { res.status(403).json({ error: "Forbidden" }); return; }
  }

  const [updated] = await db
    .update(jobPostingsTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(jobPostingsTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

router.delete("/recruitment/jobs/:id", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;

  const id = Number(req.params.id);
  const cid = user.companyId;

  /* Verify job belongs to caller's company */
  if (cid) {
    const [job] = await db
      .select({ companyId: departmentsTable.companyId })
      .from(jobPostingsTable)
      .leftJoin(departmentsTable, eq(jobPostingsTable.departmentId, departmentsTable.id))
      .where(eq(jobPostingsTable.id, id));
    if (!job) { res.status(404).json({ error: "Not found" }); return; }
    if (job.companyId !== cid) { res.status(403).json({ error: "Forbidden" }); return; }
  }

  await db.delete(jobPostingsTable).where(eq(jobPostingsTable.id, id));
  res.status(204).send();
});

/* ── Applications ── */

router.get("/recruitment/applications", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const jobId = req.query["jobId"] ? Number(req.query["jobId"]) : undefined;
  const cid = user.companyId;

  const conditions = [];
  if (jobId) {
    conditions.push(eq(applicationsTable.jobId, jobId));
  } else if (cid) {
    /* Scope to jobs that belong to this company (via their department) */
    const companyJobs = await db
      .select({ id: jobPostingsTable.id })
      .from(jobPostingsTable)
      .leftJoin(departmentsTable, eq(jobPostingsTable.departmentId, departmentsTable.id))
      .where(eq(departmentsTable.companyId, cid));
    const jobIds = companyJobs.map((j) => j.id);
    if (jobIds.length === 0) { res.json([]); return; }
    conditions.push(inArray(applicationsTable.jobId, jobIds));
  }

  const apps = await db
    .select()
    .from(applicationsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(applicationsTable.createdAt));

  res.json(apps);
});

router.post("/recruitment/applications", async (req, res) => {
  /* Public endpoint — no auth required (external applicants) */
  const [app] = await db.insert(applicationsTable).values(req.body).returning();
  res.status(201).json(app);
});

router.patch("/recruitment/applications/:id", async (req, res) => {
  const user = requireNonEmployee(req, res);
  if (!user) return;

  const id = Number(req.params.id);
  const cid = user.companyId;

  /* Verify the application's job belongs to caller's company */
  if (cid) {
    const [app] = await db
      .select({ companyId: departmentsTable.companyId })
      .from(applicationsTable)
      .leftJoin(jobPostingsTable, eq(applicationsTable.jobId, jobPostingsTable.id))
      .leftJoin(departmentsTable, eq(jobPostingsTable.departmentId, departmentsTable.id))
      .where(eq(applicationsTable.id, id));
    if (!app) { res.status(404).json({ error: "Not found" }); return; }
    if (app.companyId !== cid) { res.status(403).json({ error: "Forbidden" }); return; }
  }

  const [updated] = await db
    .update(applicationsTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(applicationsTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

export default router;
