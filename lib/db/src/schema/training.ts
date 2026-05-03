import { pgTable, serial, text, numeric, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";

export const coursesTable = pgTable("courses", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companiesTable.id),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"),
  durationHours: numeric("duration_hours", { precision: 6, scale: 1 }).default("1"),
  instructor: text("instructor"),
  provider: text("provider"),
  isRequired: boolean("is_required").default(false),
  status: text("status").notNull().default("active"),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const enrollmentsTable = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  employeeId: integer("employee_id").notNull(),
  status: text("status").notNull().default("enrolled"),
  progress: integer("progress").default(0),
  score: numeric("score", { precision: 5, scale: 2 }),
  dueDate: date("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCourseSchema = createInsertSchema(coursesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof coursesTable.$inferSelect;

export const insertEnrollmentSchema = createInsertSchema(enrollmentsTable).omit({ id: true, createdAt: true, completedAt: true });
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollmentsTable.$inferSelect;
