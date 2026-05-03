import { db } from "@workspace/db";
import {
  usersTable, announcementsTable, jobPostingsTable,
  applicationsTable, goalsTable, performanceReviewsTable,
  departmentsTable, employeesTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const COMPANY_ID = 1;

async function main() {
  console.log("Seeding new modules...");

  /* Super admin user */
  const hash = await bcrypt.hash("Admin@123", 10);
  await db.insert(usersTable).values({
    email: "superadmin@hrpay.com",
    passwordHash: hash,
    name: "Super Admin",
    role: "super_admin",
    isActive: true,
  }).onConflictDoNothing();
  console.log("✓ Super admin user seeded");

  /* Announcements — null companyId = global (visible to all companies) */
  await db.insert(announcementsTable).values([
    { title: "Welcome to HRPay 2.0", content: "We have launched our redesigned platform with Recruitment ATS, Performance Management, an AI assistant, and Reports module. Explore what's new!", type: "celebration", target: "all", isPinned: true, publishedBy: "Admin", companyId: null },
    { title: "Q2 Performance Reviews Due", content: "All managers must complete Q2 performance reviews by May 31, 2026. Log goals and feedback in the Performance module.", type: "warning", target: "management", isPinned: false, publishedBy: "HR Admin", companyId: null },
    { title: "Office Closed – Memorial Day", content: "The office will be closed Monday, May 27, 2026 in observance of Memorial Day. Remote work is permitted.", type: "info", target: "all", isPinned: false, publishedBy: "HR Admin", companyId: null },
    { title: "Benefits Open Enrollment", content: "Open enrollment for health, dental, and vision benefits runs May 1–15. Visit the Benefits page to update your selections.", type: "info", target: "all", isPinned: false, publishedBy: "HR Admin", companyId: null },
  ]).onConflictDoNothing();
  console.log("✓ Announcements seeded");

  /* Ensure seed departments exist and are scoped to COMPANY_ID */
  const existingDepts = await db.select({ id: departmentsTable.id, name: departmentsTable.name })
    .from(departmentsTable).where(eq(departmentsTable.companyId, COMPANY_ID));

  const deptMap = new Map(existingDepts.map(d => [d.name, d.id]));

  const DEPT_NAMES = ["Engineering", "Product", "Sales", "Marketing", "HR & People", "Finance", "Operations"];
  for (const name of DEPT_NAMES) {
    if (!deptMap.has(name)) {
      const [d] = await db.insert(departmentsTable).values({ name, companyId: COMPANY_ID }).returning();
      deptMap.set(name, d.id);
    }
  }

  const engId = deptMap.get("Engineering") ?? 1;
  const prodId = deptMap.get("Product") ?? 2;
  const hrId = deptMap.get("HR & People") ?? 5;
  const mktId = deptMap.get("Marketing") ?? 4;

  /* Job postings — linked to departments (company scoped via dept.company_id) */
  await db.insert(jobPostingsTable).values([
    { title: "Senior Software Engineer", departmentId: engId, description: "Lead backend development of our core platform. You will architect scalable microservices and mentor junior engineers.", requirements: "5+ years Node.js, TypeScript, PostgreSQL, AWS", type: "full_time", location: "San Francisco, CA", salaryMin: "140000", salaryMax: "180000", status: "open", postedBy: "HR Admin" },
    { title: "Product Manager", departmentId: prodId, description: "Drive product strategy and roadmap for our HR SaaS platform. Work closely with engineering and customers.", requirements: "3+ years PM experience, SaaS background preferred", type: "full_time", location: "Remote", salaryMin: "120000", salaryMax: "155000", status: "open", postedBy: "HR Admin" },
    { title: "HR Business Partner", departmentId: hrId, description: "Partner with department heads to build people programs, manage employee relations, and drive culture.", requirements: "SHRM-CP preferred, 4+ years HR generalist experience", type: "full_time", location: "New York, NY", salaryMin: "90000", salaryMax: "115000", status: "open", postedBy: "HR Admin" },
    { title: "Marketing Specialist", departmentId: mktId, description: "Execute digital marketing campaigns and drive brand awareness across social, email, and content channels.", requirements: "2+ years B2B marketing, HubSpot experience", type: "full_time", location: "Remote", salaryMin: "70000", salaryMax: "90000", status: "closed", postedBy: "HR Admin" },
  ]).onConflictDoNothing().returning();

  const jobs = await db.select().from(jobPostingsTable);
  const engJob = jobs.find(j => j.title === "Senior Software Engineer");
  const pmJob = jobs.find(j => j.title === "Product Manager");
  const hrJob = jobs.find(j => j.title === "HR Business Partner");

  if (engJob) {
    await db.insert(applicationsTable).values([
      { jobId: engJob.id, candidateName: "Alice Johnson", candidateEmail: "alice@example.com", phone: "555-0101", stage: "interview", source: "LinkedIn" },
      { jobId: engJob.id, candidateName: "Bob Martinez", candidateEmail: "bob@example.com", phone: "555-0102", stage: "screening", source: "Referral" },
      { jobId: engJob.id, candidateName: "Carol Lee", candidateEmail: "carol@example.com", phone: "555-0103", stage: "applied", source: "Website" },
    ]).onConflictDoNothing();
  }
  if (pmJob) {
    await db.insert(applicationsTable).values([
      { jobId: pmJob.id, candidateName: "David Kim", candidateEmail: "david@example.com", phone: "555-0104", stage: "offer", source: "LinkedIn" },
      { jobId: pmJob.id, candidateName: "Emma Wilson", candidateEmail: "emma@example.com", phone: "555-0105", stage: "interview", source: "AngelList" },
    ]).onConflictDoNothing();
  }
  if (hrJob) {
    await db.insert(applicationsTable).values([
      { jobId: hrJob.id, candidateName: "Frank Chen", candidateEmail: "frank@example.com", phone: "555-0106", stage: "applied", source: "Indeed" },
    ]).onConflictDoNothing();
  }
  console.log("✓ Jobs & applications seeded");

  /* Goals — look up real employee IDs from this company */
  const employees = await db.select({ id: employeesTable.id })
    .from(employeesTable)
    .where(eq(employeesTable.companyId, COMPANY_ID))
    .limit(6);

  if (employees.length >= 1) {
    await db.insert(goalsTable).values([
      { employeeId: employees[0].id, title: "Launch microservices migration", description: "Break monolith into 5 core microservices by Q3", category: "team", target: "5 services in production", progress: 65, status: "active", dueDate: "2026-09-30", cycle: "Q2-Q3 2026" },
      { employeeId: employees[0].id, title: "Reduce API response time", description: "Achieve p99 < 100ms across all endpoints", category: "individual", target: "p99 < 100ms", progress: 80, status: "active", dueDate: "2026-06-30", cycle: "Q2 2026" },
    ]).onConflictDoNothing();
  }
  if (employees.length >= 2) {
    await db.insert(goalsTable).values([
      { employeeId: employees[1].id, title: "Ship v2.0 product roadmap", description: "Deliver 3 major features by end of quarter", category: "individual", target: "3 features shipped", progress: 40, status: "active", dueDate: "2026-06-30", cycle: "Q2 2026" },
    ]).onConflictDoNothing();
  }
  if (employees.length >= 3) {
    await db.insert(goalsTable).values([
      { employeeId: employees[2].id, title: "Reduce time-to-hire to 21 days", description: "Optimize recruitment funnel across all open roles", category: "team", target: "21 day average TTH", progress: 55, status: "active", dueDate: "2026-07-31", cycle: "Q2-Q3 2026" },
    ]).onConflictDoNothing();
  }
  if (employees.length >= 4) {
    await db.insert(goalsTable).values([
      { employeeId: employees[3].id, title: "Complete AWS Solutions Architect certification", description: "Study and pass the AWS SAA exam", category: "individual", target: "Pass exam", progress: 100, status: "completed", dueDate: "2026-04-30", cycle: "Q1 2026" },
    ]).onConflictDoNothing();
  }
  if (employees.length >= 5) {
    await db.insert(goalsTable).values([
      { employeeId: employees[4].id, title: "Improve sales pipeline by 30%", description: "Expand outreach and conversion initiatives", category: "individual", target: "+30% MRR from new deals", progress: 25, status: "active", dueDate: "2026-09-30", cycle: "Q2-Q3 2026" },
    ]).onConflictDoNothing();
  }
  console.log("✓ Goals seeded");

  /* Performance reviews — use real employee IDs */
  if (employees.length >= 1) {
    await db.insert(performanceReviewsTable).values([
      { employeeId: employees[0].id, cycle: "annual", period: "2025", overallRating: "4.5", status: "completed", strengths: "Exceptional technical leadership, mentors junior engineers consistently", improvements: "Could improve cross-team documentation and async communication", managerFeedback: "Outstanding contributor — exceeded all engineering targets and delivered critical platform changes on schedule." },
    ]).onConflictDoNothing();
  }
  if (employees.length >= 2) {
    await db.insert(performanceReviewsTable).values([
      { employeeId: employees[1].id, cycle: "annual", period: "2025", overallRating: "4.2", status: "completed", strengths: "Strong product vision, excellent stakeholder management, clear roadmap communication", improvements: "Data-driven decision making could be strengthened with more A/B testing", managerFeedback: "Consistently delivers high-impact features on schedule. A strong product leader the team respects." },
    ]).onConflictDoNothing();
  }
  if (employees.length >= 3) {
    await db.insert(performanceReviewsTable).values([
      { employeeId: employees[2].id, cycle: "half-yearly", period: "H1 2026", status: "pending" },
    ]).onConflictDoNothing();
  }
  if (employees.length >= 4) {
    await db.insert(performanceReviewsTable).values([
      { employeeId: employees[3].id, cycle: "annual", period: "2025", overallRating: "3.8", status: "completed", strengths: "Fast learner, highly reliable delivery, great attitude", improvements: "Leadership skills development needed to move to senior level", managerFeedback: "Good performer with a clear growth trajectory. Ready for stretch assignments." },
    ]).onConflictDoNothing();
  }
  if (employees.length >= 5) {
    await db.insert(performanceReviewsTable).values([
      { employeeId: employees[4].id, cycle: "annual", period: "2025", overallRating: "4.0", status: "completed", strengths: "Excellent client relationships, consistently hits quota", improvements: "Internal CRM hygiene and deal documentation", managerFeedback: "Reliable revenue contributor. Consistent top-3 in the sales team." },
    ]).onConflictDoNothing();
  }
  console.log("✓ Performance reviews seeded");

  console.log("\n✅ All done! Login: superadmin@hrpay.com / Admin@123");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
