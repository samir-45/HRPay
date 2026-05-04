import { pgTable, serial, integer, date, time, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const regularizationRequestsTable = pgTable("regularization_requests", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  date: date("date").notNull(),
  requestedClockIn: time("requested_clock_in").notNull(),
  requestedClockOut: time("requested_clock_out").notNull(),
  reason: text("reason").notNull(),
  status: text("status").default("pending"), // pending, approved, rejected
  approvedBy: integer("approved_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRegularizationRequestSchema = createInsertSchema(regularizationRequestsTable).omit({ id: true, createdAt: true });
export type RegularizationRequest = typeof regularizationRequestsTable.$inferSelect;
export type InsertRegularizationRequest = z.infer<typeof insertRegularizationRequestSchema>;
