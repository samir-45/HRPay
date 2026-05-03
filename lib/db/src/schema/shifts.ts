import { pgTable, serial, text, integer, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shiftsTable = pgTable("shifts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  graceMunites: integer("grace_minutes").default(10),
  breakMinutes: integer("break_minutes").default(60),
  workingDays: text("working_days").notNull().default("Mon,Tue,Wed,Thu,Fri"),
  overtimeThreshold: numeric("overtime_threshold", { precision: 4, scale: 2 }).default("8.0"),
  color: text("color").default("#a3e635"),
  companyId: integer("company_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shiftAssignmentsTable = pgTable("shift_assignments", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id"),
  departmentId: integer("department_id"),
  shiftId: integer("shift_id"),
  effectiveFrom: date("effective_from"),
  effectiveTo: date("effective_to"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertShiftSchema = createInsertSchema(shiftsTable).omit({ id: true, createdAt: true });
export const insertShiftAssignmentSchema = createInsertSchema(shiftAssignmentsTable).omit({ id: true, createdAt: true });
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type Shift = typeof shiftsTable.$inferSelect;
export type ShiftAssignment = typeof shiftAssignmentsTable.$inferSelect;
