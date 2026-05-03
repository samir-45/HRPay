import { pgTable, serial, text, numeric, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const payrollRunsTable = pgTable("payroll_runs", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id"),
  name: text("name").notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  payDate: date("pay_date").notNull(),
  status: text("status").notNull().default("draft"),
  totalGrossPay: numeric("total_gross_pay", { precision: 12, scale: 2 }).default("0"),
  totalNetPay: numeric("total_net_pay", { precision: 12, scale: 2 }).default("0"),
  totalTaxes: numeric("total_taxes", { precision: 12, scale: 2 }).default("0"),
  totalDeductions: numeric("total_deductions", { precision: 12, scale: 2 }).default("0"),
  employeeCount: integer("employee_count").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

export const payStubsTable = pgTable("pay_stubs", {
  id: serial("id").primaryKey(),
  payrollRunId: integer("payroll_run_id").notNull(),
  employeeId: integer("employee_id").notNull(),
  grossPay: numeric("gross_pay", { precision: 12, scale: 2 }).notNull(),
  netPay: numeric("net_pay", { precision: 12, scale: 2 }).notNull(),
  federalTax: numeric("federal_tax", { precision: 12, scale: 2 }).default("0"),
  stateTax: numeric("state_tax", { precision: 12, scale: 2 }).default("0"),
  socialSecurity: numeric("social_security", { precision: 12, scale: 2 }).default("0"),
  medicare: numeric("medicare", { precision: 12, scale: 2 }).default("0"),
  healthInsurance: numeric("health_insurance", { precision: 12, scale: 2 }).default("0"),
  retirement: numeric("retirement", { precision: 12, scale: 2 }).default("0"),
  hoursWorked: numeric("hours_worked", { precision: 6, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPayrollRunSchema = createInsertSchema(payrollRunsTable).omit({ id: true, createdAt: true, processedAt: true });
export type InsertPayrollRun = z.infer<typeof insertPayrollRunSchema>;
export type PayrollRun = typeof payrollRunsTable.$inferSelect;

export const insertPayStubSchema = createInsertSchema(payStubsTable).omit({ id: true, createdAt: true });
export type InsertPayStub = z.infer<typeof insertPayStubSchema>;
export type PayStub = typeof payStubsTable.$inferSelect;
