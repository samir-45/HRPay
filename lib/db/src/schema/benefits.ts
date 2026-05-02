import { pgTable, serial, text, numeric, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const benefitPlansTable = pgTable("benefit_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  provider: text("provider"),
  description: text("description"),
  employeeCost: numeric("employee_cost", { precision: 10, scale: 2 }).default("0"),
  employerCost: numeric("employer_cost", { precision: 10, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const benefitEnrollmentsTable = pgTable("benefit_enrollments", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  planId: integer("plan_id").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBenefitPlanSchema = createInsertSchema(benefitPlansTable).omit({ id: true, createdAt: true });
export type InsertBenefitPlan = z.infer<typeof insertBenefitPlanSchema>;
export type BenefitPlan = typeof benefitPlansTable.$inferSelect;

export const insertBenefitEnrollmentSchema = createInsertSchema(benefitEnrollmentsTable).omit({ id: true, createdAt: true, enrolledAt: true });
export type InsertBenefitEnrollment = z.infer<typeof insertBenefitEnrollmentSchema>;
export type BenefitEnrollment = typeof benefitEnrollmentsTable.$inferSelect;
