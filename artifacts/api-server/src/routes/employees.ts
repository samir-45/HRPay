import { Router } from "express";
import { db } from "@workspace/db";
import { employeesTable, departmentsTable } from "@workspace/db";
import { eq, ilike, and, or } from "drizzle-orm";
import {
  ListEmployeesQueryParams,
  CreateEmployeeBody,
  GetEmployeeParams,
  UpdateEmployeeParams,
  UpdateEmployeeBody,
  DeleteEmployeeParams,
} from "@workspace/api-zod";
import { notify } from "../lib/notify";

const router = Router();

router.get("/employees", async (req, res) => {
  const query = ListEmployeesQueryParams.parse(req.query);
  const { department, status, search, page, limit } = query;

  const conditions = [];
  if (status) conditions.push(eq(employeesTable.status, status));

  let employees = await db
    .select({
      id: employeesTable.id,
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
        e.position.toLowerCase().includes(s)
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
  const body = CreateEmployeeBody.parse(req.body);
  const [employee] = await db.insert(employeesTable).values(body).returning();

  await notify(
    "New Employee Joined",
    `${employee.firstName} ${employee.lastName} has been added as ${employee.position}${body.departmentId ? "" : ""}.`,
    "celebration"
  );

  res.status(201).json(employee);
});

router.get("/employees/:id", async (req, res) => {
  const { id } = GetEmployeeParams.parse({ id: Number(req.params.id) });
  const [row] = await db
    .select({
      id: employeesTable.id,
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
    .where(eq(employeesTable.id, id));
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

router.put("/employees/:id", async (req, res) => {
  const { id } = UpdateEmployeeParams.parse({ id: Number(req.params.id) });
  const body = UpdateEmployeeBody.parse(req.body);
  const [updated] = await db
    .update(employeesTable)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(employeesTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

router.delete("/employees/:id", async (req, res) => {
  const { id } = DeleteEmployeeParams.parse({ id: Number(req.params.id) });
  await db.delete(employeesTable).where(eq(employeesTable.id, id));
  res.status(204).send();
});

export default router;
