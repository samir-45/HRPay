import { db } from "@workspace/db";
import {
  usersTable, announcementsTable, jobPostingsTable,
  applicationsTable, goalsTable, performanceReviewsTable,
  departmentsTable, employeesTable, companiesTable,
  payrollRunsTable, leaveRequestsTable, timeEntriesTable,
  expenseClaimsTable, coursesTable, enrollmentsTable,
  assetsTable, onboardingTasksTable, benefitPlansTable,
  benefitEnrollmentsTable
} from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const COMPANY_ID = 1;

async function main() {
  console.log("Seeding new modules...");

  /* Ensure company exists */
  const [existingCompany] = await db.select().from(companiesTable).where(eq(companiesTable.id, COMPANY_ID));
  if (!existingCompany) {
    await db.insert(companiesTable).values({
      id: COMPANY_ID,
      name: "Test Corp",
      slug: "test-corp",
      plan: "pro",
      domain: "testcorp.com",
      settings: {
        currency: "USD",
        timezone: "UTC",
        dateFormat: "MM/DD/YYYY",
        aiInsightsEnabled: true
      }
    }).onConflictDoNothing();
    console.log("✓ Default company created");
  }

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

  /* Company Admin user */
  await db.insert(usersTable).values({
    email: "john@testcorp.com",
    passwordHash: hash,
    name: "John Admin",
    role: "company_admin",
    companyId: COMPANY_ID,
    isActive: true,
  }).onConflictDoNothing();
  console.log("✓ Company admin user seeded");

  /* Test Employee user */
  await db.insert(usersTable).values({
    email: "samtsan6@gmail.com",
    passwordHash: hash,
    name: "Sam Employee",
    role: "employee",
    companyId: COMPANY_ID,
    isActive: true,
  }).onConflictDoNothing();
  console.log("✓ Test employee seeded");

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

  /* Create Employees */
  console.log("Seeding employees...");
  const employeesData = [
    { name: "John Admin", email: "john@testcorp.com", code: "EMP-000001", role: "Manager", dept: "HR & People", salary: "95000" },
    { name: "Sam Employee", email: "samtsan6@gmail.com", code: "EMP-000002", role: "Software Engineer", dept: "Engineering", salary: "85000" },
    { name: "Alice Smith", email: "alice@testcorp.com", code: "EMP-000003", role: "Senior Developer", dept: "Engineering", salary: "120000" },
    { name: "Bob Wilson", email: "bob@testcorp.com", code: "EMP-000004", role: "Product Designer", dept: "Product", salary: "90000" },
    { name: "Charlie Davis", email: "charlie@testcorp.com", code: "EMP-000005", role: "Sales Executive", dept: "Sales", salary: "75000" },
    { name: "Diana Prince", email: "diana@testcorp.com", code: "EMP-000006", role: "Marketing Manager", dept: "Marketing", salary: "110000" },
    { name: "Edward Norton", email: "edward@testcorp.com", code: "EMP-000007", role: "Finance Analyst", dept: "Finance", salary: "88000" },
    { name: "Fiona Gallagher", email: "fiona@testcorp.com", code: "EMP-000008", role: "Operations Lead", dept: "Operations", salary: "92000" },
  ];

  for (const emp of employeesData) {
    await db.insert(employeesTable).values({
      companyId: COMPANY_ID,
      departmentId: deptMap.get(emp.dept) ?? engId,
      firstName: emp.name.split(" ")[0],
      lastName: emp.name.split(" ")[1],
      email: emp.email,
      employeeCode: emp.code,
      position: emp.role,
      salary: emp.salary,
      status: "active",
      employmentType: "full_time",
      startDate: "2024-01-15",
    }).onConflictDoNothing();
  }

  const allEmployees = await db.select().from(employeesTable).where(eq(employeesTable.companyId, COMPANY_ID));
  const empIds = allEmployees.map(e => e.id);

  /* Payroll Runs */
  console.log("Seeding payroll...");
  const payrollData = [
    { name: "January Payroll", start: "2026-01-01", end: "2026-01-31", pay: "2026-01-28", gross: "82450.00", net: "64310.00", tax: "18140.00" },
    { name: "February Payroll", start: "2026-02-01", end: "2026-02-28", pay: "2026-02-28", gross: "81900.00", net: "63880.00", tax: "18020.00" },
    { name: "March Payroll", start: "2026-03-01", end: "2026-03-31", pay: "2026-03-28", gross: "83100.00", net: "64800.00", tax: "18300.00" },
    { name: "April Payroll", start: "2026-04-01", end: "2026-04-30", pay: "2026-04-28", gross: "84200.00", net: "65600.00", tax: "18600.00" },
  ];

  for (const p of payrollData) {
    await db.insert(payrollRunsTable).values({
      companyId: COMPANY_ID,
      name: p.name,
      periodStart: p.start,
      periodEnd: p.end,
      payDate: p.pay,
      status: "completed",
      totalGrossPay: p.gross,
      totalNetPay: p.net,
      totalTaxes: p.tax,
      processedAt: new Date(p.pay),
    }).onConflictDoNothing();
  }

  /* Leave Requests */
  console.log("Seeding leave...");
  await db.insert(leaveRequestsTable).values([
    { employeeId: empIds[1], type: "vacation", startDate: "2026-06-01", endDate: "2026-06-05", status: "pending", reason: "Family trip", days: "5" },
    { employeeId: empIds[2], type: "sick", startDate: "2026-05-10", endDate: "2026-05-11", status: "approved", reason: "Fever", days: "2" },
    { employeeId: empIds[3], type: "personal", startDate: "2026-06-15", endDate: "2026-06-15", status: "pending", reason: "Personal work", days: "1" },
  ]).onConflictDoNothing();

  /* Time Entries */
  console.log("Seeding time tracking...");
  const todayStr = new Date().toISOString().split('T')[0];
  for (const id of empIds.slice(0, 5)) {
    await db.insert(timeEntriesTable).values({
      employeeId: id,
      date: todayStr,
      status: "pending",
      hoursWorked: "8",
    }).onConflictDoNothing();
  }

  /* Expenses */
  console.log("Seeding expenses...");
  await db.insert(expenseClaimsTable).values([
    { employeeId: empIds[1], title: "Client Dinner", amount: "125.50", category: "meals", status: "pending", expenseDate: todayStr },
    { employeeId: empIds[2], title: "AWS Training", amount: "450.00", category: "training", status: "approved", expenseDate: todayStr },
  ]).onConflictDoNothing();

  /* Training Courses */
  console.log("Seeding training...");
  const courses = await db.insert(coursesTable).values([
    { companyId: COMPANY_ID, title: "Company Security Policy 2026", category: "security", durationHours: "2.5", isRequired: true, provider: "Internal" },
    { companyId: COMPANY_ID, title: "Effective Communication", category: "soft_skills", durationHours: "4.0", provider: "LinkedIn Learning" },
    { companyId: COMPANY_ID, title: "Introduction to React v19", category: "technical", durationHours: "12.0", provider: "Frontend Masters" },
  ]).onConflictDoNothing().returning();

  if (courses.length > 0) {
    await db.insert(enrollmentsTable).values([
      { courseId: courses[0].id, employeeId: empIds[1], status: "completed", progress: 100, score: "95.00" },
      { courseId: courses[1].id, employeeId: empIds[2], status: "enrolled", progress: 45 },
    ]).onConflictDoNothing();
  }

  /* Assets */
  console.log("Seeding assets...");
  await db.insert(assetsTable).values([
    { companyId: COMPANY_ID, name: "MacBook Pro 14\"", category: "laptop", brand: "Apple", serialNumber: "SN-987654", status: "assigned", assignedTo: empIds[1] },
    { companyId: COMPANY_ID, name: "Dell UltraSharp 27\"", category: "monitor", brand: "Dell", serialNumber: "SN-112233", status: "assigned", assignedTo: empIds[1] },
    { companyId: COMPANY_ID, name: "Logitech MX Master 3S", category: "peripherals", brand: "Logitech", status: "available" },
  ]).onConflictDoNothing();

  /* Onboarding Tasks */
  console.log("Seeding onboarding...");
  await db.insert(onboardingTasksTable).values([
    { employeeId: empIds[1], title: "Sign Employment Contract", category: "documentation", priority: "high", isCompleted: true },
    { employeeId: empIds[1], title: "Background Verification", category: "documentation", priority: "high", isCompleted: true },
    { employeeId: empIds[1], title: "IT Hardware Setup", category: "it", priority: "medium", isCompleted: false },
    { employeeId: empIds[2], title: "Initial HR Briefing", category: "hr", priority: "medium", isCompleted: false },
  ]).onConflictDoNothing();

  /* Benefit Plans */
  console.log("Seeding benefits...");
  const plans = await db.insert(benefitPlansTable).values([
    { companyId: COMPANY_ID, name: "Premium Health Insurance", type: "medical", provider: "Blue Cross", employeeCost: "150.00", employerCost: "450.00" },
    { companyId: COMPANY_ID, name: "Vision & Dental Plus", type: "dental", provider: "Aetna", employeeCost: "45.00", employerCost: "90.00" },
    { companyId: COMPANY_ID, name: "401k Retirement Plan", type: "retirement", provider: "Fidelity", employeeCost: "0.00", employerCost: "0.00" },
  ]).onConflictDoNothing().returning();

  if (plans.length > 0) {
    await db.insert(benefitEnrollmentsTable).values([
      { employeeId: empIds[1], planId: plans[0].id },
      { employeeId: empIds[1], planId: plans[2].id },
      { employeeId: empIds[2], planId: plans[1].id },
    ]).onConflictDoNothing();
  }

  console.log("\n✅ All done! Login: superadmin@hrpay.com / Admin@123");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
