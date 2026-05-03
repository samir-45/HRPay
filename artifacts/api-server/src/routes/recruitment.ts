import { Router } from "express";
import { db } from "@workspace/db";
import { jobPostingsTable, applicationsTable, departmentsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { getRequestUser, requireNonEmployee } from "../lib/auth-helpers";

const router = Router();

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
  if (!requireNonEmployee(req, res)) return;
  const [updated] = await db
    .update(jobPostingsTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(jobPostingsTable.id, Number(req.params.id)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

router.delete("/recruitment/jobs/:id", async (req, res) => {
  if (!requireNonEmployee(req, res)) return;
  await db.delete(jobPostingsTable).where(eq(jobPostingsTable.id, Number(req.params.id)));
  res.status(204).send();
});

router.get("/recruitment/applications", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const jobId = req.query["jobId"] ? Number(req.query["jobId"]) : undefined;
  const conditions = jobId ? [eq(applicationsTable.jobId, jobId)] : [];

  const apps = await db
    .select()
    .from(applicationsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(applicationsTable.createdAt));

  res.json(apps);
});

router.post("/recruitment/applications", async (req, res) => {
  const [app] = await db.insert(applicationsTable).values(req.body).returning();
  res.status(201).json(app);
});

router.patch("/recruitment/applications/:id", async (req, res) => {
  if (!requireNonEmployee(req, res)) return;
  const [updated] = await db
    .update(applicationsTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(applicationsTable.id, Number(req.params.id)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

export default router;
