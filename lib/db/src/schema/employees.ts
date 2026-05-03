import { pgTable, serial, text, numeric, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const employeesTable = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeCode: text("employee_code").unique(),
  companyId: integer("company_id"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  position: text("position").notNull(),
  departmentId: integer("department_id"),
  employmentType: text("employment_type").notNull().default("full_time"),
  status: text("status").notNull().default("active"),
  startDate: date("start_date").notNull(),
  salary: numeric("salary", { precision: 12, scale: 2 }),
  salaryType: text("salary_type").default("annual"),
  managerId: integer("manager_id"),
  avatarUrl: text("avatar_url"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country").default("US"),
  taxId: text("tax_id"),
  bankAccount: text("bank_account"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEmployeeSchema = createInsertSchema(employeesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employeesTable.$inferSelect;
