import { pgTable, serial, text, numeric, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const expenseClaimsTable = pgTable("expense_claims", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull().default("other"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  expenseDate: date("expense_date").notNull(),
  receiptUrl: text("receipt_url"),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  reviewedBy: text("reviewed_by"),
  reviewNotes: text("review_notes"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertExpenseClaimSchema = createInsertSchema(expenseClaimsTable).omit({ id: true, createdAt: true, reviewedAt: true, submittedAt: true });
export type InsertExpenseClaim = z.infer<typeof insertExpenseClaimSchema>;
export type ExpenseClaim = typeof expenseClaimsTable.$inferSelect;
