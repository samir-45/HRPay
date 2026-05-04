import { pgTable, serial, integer, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shiftAssignmentsTable = pgTable("shift_assignments", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id"),
  departmentId: integer("department_id"),
  shiftId: integer("shift_id").notNull(),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertShiftAssignmentSchema = createInsertSchema(shiftAssignmentsTable).omit({ id: true, createdAt: true });
export type ShiftAssignment = typeof shiftAssignmentsTable.$inferSelect;
export type InsertShiftAssignment = z.infer<typeof insertShiftAssignmentSchema>;
