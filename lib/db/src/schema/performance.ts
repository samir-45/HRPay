import { pgTable, serial, text, integer, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const goalsTable = pgTable("goals", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").default("individual"),
  target: text("target"),
  progress: integer("progress").default(0),
  status: text("status").notNull().default("active"),
  dueDate: date("due_date"),
  cycle: text("cycle"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const performanceReviewsTable = pgTable("performance_reviews", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  reviewerId: integer("reviewer_id"),
  cycle: text("cycle").notNull(),
  period: text("period").notNull(),
  overallRating: numeric("overall_rating", { precision: 3, scale: 1 }),
  status: text("status").notNull().default("pending"),
  selfReview: text("self_review"),
  managerFeedback: text("manager_feedback"),
  peerFeedback: text("peer_feedback"),
  strengths: text("strengths"),
  improvements: text("improvements"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGoalSchema = createInsertSchema(goalsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goalsTable.$inferSelect;

export const insertPerformanceReviewSchema = createInsertSchema(performanceReviewsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPerformanceReview = z.infer<typeof insertPerformanceReviewSchema>;
export type PerformanceReview = typeof performanceReviewsTable.$inferSelect;
