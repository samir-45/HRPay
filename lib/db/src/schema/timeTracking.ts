import { pgTable, serial, text, numeric, integer, timestamp, date, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const timeEntriesTable = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  date: date("date").notNull(),
  clockIn: timestamp("clock_in"),
  clockOut: timestamp("clock_out"),
  hoursWorked: numeric("hours_worked", { precision: 6, scale: 2 }),
  overtimeHours: numeric("overtime_hours", { precision: 6, scale: 2 }).default("0"),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  // New columns for attendance enhancements
  method: text("method").default("manual"), // fingerprint, face, nfc, pin, mobile, manual, qr
  deviceId: integer("device_id").references(() => attendanceDevicesTable.id),
  lateMinutes: integer("late_minutes").default(0),
  isRegularized: boolean("is_regularized").default(false),
  originalClockIn: timestamp("original_clock_in"),
  originalClockOut: timestamp("original_clock_out"),
  shiftId: integer("shift_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTimeEntrySchema = createInsertSchema(timeEntriesTable).omit({ id: true, createdAt: true });
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type TimeEntry = typeof timeEntriesTable.$inferSelect;

// Import attendance devices table for reference
import { attendanceDevicesTable } from "./attendanceDevices";
