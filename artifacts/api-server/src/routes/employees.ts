import { Router } from "express";
import { db } from "@workspace/db";
import { employeesTable, departmentsTable, onboardingTasksTable, leaveBalancesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  ListEmployeesQueryParams,
  CreateEmployeeBody,
  GetEmployeeParams,
  UpdateEmployeeParams,
  UpdateEmployeeBody,
  DeleteEmployeeParams,
} from "@workspace/api-zod";
import { notify } from "../lib/notify";
import { getRequestUser, requireCompanyUser } from "../lib/auth-helpers";

const router = Router();

function generateEmployeeCode(id: number): string {
  return "EMP-" + String(id).padStart(6, "0");
}

const DEFAULT_ONBOARDING_TASKS = [
  { title: "Complete personal information form", category: "documentation", priority: "high", description: "Fill in all required personal details in the HR system." },
  { title: "Review and sign employment contract", category: "documentation", priority: "high", description: "Read, acknowledge, and sign your employment agreement." },
  { title: "Set up workstation and system access", category: "it_setup", priority: "high", description: "IT will configure your computer, email, and system credentials." },
  { title: "Review employee handbook & policies", category: "policy", priority: "medium", description: "Read through company policies, code of conduct, and benefits overview." },
  { title: "Complete benefits enrollment", category: "benefits", priority: "medium", description: "Select your health, dental, and retirement plan options." },
  { title: "Attend company orientation session", category: "orientation", priority: "medium", description: "Join the onboarding orientation with HR and your team lead." },
  { title: "Meet your team and key stakeholders", category: "orientation", priority: "low", description: "Schedule introductory meetings with your manager and teammates." },
];

const DEFAULT_LEAVE_TYPES = ["vacation", "sick", "personal"] as const;
const DEFAULT_LEAVE_ALLOCATION = 14;

async function seedOnboardingTasks(employeeId: number, startDate: string | null) {
  const dueBase = startDate ? new Date(startDate) : new Date();
  const tasks = DEFAULT_ONBOARDING_TASKS.map((t, i) => ({
    employeeId,
    title: t.title,
    description: t.description,
    category: t.category,
    priority: t.priority,
    dueDate: new Date(dueBase.getTime() + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    isCompleted: false,
    assignedTo: "HR",
  }));
  if (tasks.length > 0) {
    await db.insert(onboardingTasksTable).values(tasks);
  }
}

async function seedLeaveBalances(employeeId: number) {
  const year = new Date().getFullYear();
  const values = DEFAULT_LEAVE_TYPES.map((type) => ({
    employeeId,
    type,
    allocated: String(DEFAULT_LEAVE_ALLOCATION),
    used: "0",
    pending: "0",
    year,
  }));
  await db.insert(leaveBalancesTable).values(values).onConflictDoNothing();
}

router.get("/employees", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const query = ListEmployeesQueryParams.parse(req.query);
  const { department, status, search, page, limit } = query;

  const conditions = [];
  if (user.companyId) conditions.push(eq(employeesTable.companyId, user.companyId));
  if (status) conditions.push(eq(employeesTable.status, status));

  let employees = await db
    .select({
      id: employeesTable.id,
      employeeCode: employeesTable.employeeCode,
      firstName: employeesTable.firstName,
      lastName: employeesTable.lastName,
      email: employeesTable.email,
      phone: employeesTable.phone,
      position: employeesTable.position,
      departmentId: employeesTable.departmentId,
      departmentName: departmentsTable.name,
      employmentType: employeesTable.employmentType,
      status: employeesTable.status,
      startDate: employeesTable.startDate,
      salary: employeesTable.salary,
      salaryType: employeesTable.salaryType,
      managerId: employeesTable.managerId,
      avatarUrl: employeesTable.avatarUrl,
      address: employeesTable.address,
      city: employeesTable.city,
      state: employeesTable.state,
      country: employeesTable.country,
      createdAt: employeesTable.createdAt,
      updatedAt: employeesTable.updatedAt,
    })
    .from(employeesTable)
    .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  if (search) {
    const s = search.toLowerCase();
    employees = employees.filter(
      (e) =>
        e.firstName.toLowerCase().includes(s) ||
        e.lastName.toLowerCase().includes(s) ||
        e.email.toLowerCase().includes(s) ||
        e.position.toLowerCase().includes(s) ||
        (e.employeeCode ?? "").toLowerCase().includes(s)
    );
  }

  if (department) {
    employees = employees.filter(
      (e) => e.departmentName?.toLowerCase() === department.toLowerCase()
    );
  }

  const total = employees.length;
  const offset = (page - 1) * limit;
  const paginated = employees.slice(offset, offset + limit);

  res.json({ employees: paginated, total, page, limit });
});

router.post("/employees", async (req, res) => {
  const user = requireCompanyUser(req, res);
  if (!user) return;

  const body = CreateEmployeeBody.parse(req.body);

  const maxRow = await db
    .select({ maxId: sql<number>`COALESCE(MAX(id), 0)` })
    .from(employeesTable);
  const nextId = (maxRow[0]?.maxId ?? 0) + 1;
  const employeeCode = generateEmployeeCode(nextId);

  const [employee] = await db
    .insert(employeesTable)
    .values({ ...body, companyId: user.companyId, employeeCode })
    .returning();

  if (employee.employeeCode == null) {
    await db
      .update(employeesTable)
      .set({ employeeCode: generateEmployeeCode(employee.id) })
      .where(eq(employeesTable.id, employee.id));
    employee.employeeCode = generateEmployeeCode(employee.id);
  }

  // Auto-seed onboarding tasks and leave balances in background (non-blocking)
  Promise.all([
    seedOnboardingTasks(employee.id, employee.startDate),
    seedLeaveBalances(employee.id),
  ]).catch(() => {});

  await notify(
    "New Employee Joined",
    `${employee.firstName} ${employee.lastName} (${employee.employeeCode}) has been added as ${employee.position}.`,
    "celebration",
    "System",
    user.companyId
  );

  res.status(201).json(employee);
});

/* ── Self-service: authenticated employee reads/updates their own record ── */

router.get("/employees/me", async (req, res) => {
  const authUser = getRequestUser(req);
  if (!authUser) { res.status(401).json({ error: "Not authenticated" }); return; }

  const [row] = await db
    .select({
      id: employeesTable.id,
      employeeCode: employeesTable.employeeCode,
      firstName: employeesTable.firstName,
      lastName: employeesTable.lastName,
      email: employeesTable.email,
      phone: employeesTable.phone,
      position: employeesTable.position,
      departmentId: employeesTable.departmentId,
      departmentName: departmentsTable.name,
      employmentType: employeesTable.employmentType,
      status: employeesTable.status,
      startDate: employeesTable.startDate,
      avatarUrl: employeesTable.avatarUrl,
      address: employeesTable.address,
      city: employeesTable.city,
      state: employeesTable.state,
      country: employeesTable.country,
    })
    .from(employeesTable)
    .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
    .where(eq(employeesTable.email, authUser.email.toLowerCase()));

  if (!row) { res.status(404).json({ error: "Employee record not found for this account" }); return; }
  res.json(row);
});

router.patch("/employees/me", async (req, res) => {
  const authUser = getRequestUser(req);
  if (!authUser) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { firstName, lastName, phone, avatarUrl, address, city, state, country } = req.body as {
    firstName?: string; lastName?: string; phone?: string;
    avatarUrl?: string; address?: string; city?: string; state?: string; country?: string;
  };

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (firstName !== undefined) patch.firstName = firstName;
  if (lastName !== undefined) patch.lastName = lastName;
  if (phone !== undefined) patch.phone = phone;
  if (avatarUrl !== undefined) patch.avatarUrl = avatarUrl;
  if (address !== undefined) patch.address = address;
  if (city !== undefined) patch.city = city;
  if (state !== undefined) patch.state = state;
  if (country !== undefined) patch.country = country;

  const [updated] = await db
    .update(employeesTable)
    .set(patch)
    .where(eq(employeesTable.email, authUser.email.toLowerCase()))
    .returning();

  if (!updated) { res.status(404).json({ error: "Employee record not found" }); return; }
  res.json(updated);
});

/* ── Admin CRUD ── */

router.get("/employees/:id", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { id } = GetEmployeeParams.parse({ id: Number(req.params.id) });
  const conditions = [eq(employeesTable.id, id)];
  if (user.companyId) conditions.push(eq(employeesTable.companyId, user.companyId));

  const [row] = await db
    .select({
      id: employeesTable.id,
      employeeCode: employeesTable.employeeCode,
      firstName: employeesTable.firstName,
      lastName: employeesTable.lastName,
      email: employeesTable.email,
      phone: employeesTable.phone,
      position: employeesTable.position,
      departmentId: employeesTable.departmentId,
      departmentName: departmentsTable.name,
      employmentType: employeesTable.employmentType,
      status: employeesTable.status,
      startDate: employeesTable.startDate,
      salary: employeesTable.salary,
      salaryType: employeesTable.salaryType,
      managerId: employeesTable.managerId,
      avatarUrl: employeesTable.avatarUrl,
      address: employeesTable.address,
      city: employeesTable.city,
      state: employeesTable.state,
      country: employeesTable.country,
      taxId: employeesTable.taxId,
      bankAccount: employeesTable.bankAccount,
      createdAt: employeesTable.createdAt,
      updatedAt: employeesTable.updatedAt,
    })
    .from(employeesTable)
    .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
    .where(and(...conditions));

  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

router.put("/employees/:id", async (req, res) => {
  const user = requireCompanyUser(req, res);
  if (!user) return;

  const { id } = UpdateEmployeeParams.parse({ id: Number(req.params.id) });
  const body = UpdateEmployeeBody.parse(req.body);
  const [updated] = await db
    .update(employeesTable)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(employeesTable.id, id), eq(employeesTable.companyId, user.companyId)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

router.delete("/employees/:id", async (req, res) => {
  const user = requireCompanyUser(req, res);
  if (!user) return;

  const { id } = DeleteEmployeeParams.parse({ id: Number(req.params.id) });
  await db
    .delete(employeesTable)
    .where(and(eq(employeesTable.id, id), eq(employeesTable.companyId, user.companyId)));
  res.status(204).send();
});

export default router;
