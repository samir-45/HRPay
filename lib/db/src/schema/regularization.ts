import { pgTable, serial, text, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const regularizationRequestsTable = pgTable("regularization_requests", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  timeEntryId: integer("time_entry_id"),
  date: date("date").notNull(),
  requestedIn: timestamp("requested_in"),
  requestedOut: timestamp("requested_out"),
  reason: text("reason"),
  status: text("status").default("pending"),
  approvedBy: integer("approved_by"),
  companyId: integer("company_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRegularizationSchema = createInsertSchema(regularizationRequestsTable).omit({ id: true, createdAt: true });
export type RegularizationRequest = typeof regularizationRequestsTable.$inferSelect;
export type InsertRegularization = z.infer<typeof insertRegularizationSchema>;
