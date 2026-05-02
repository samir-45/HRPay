import { pgTable, serial, text, integer, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobPostingsTable = pgTable("job_postings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  departmentId: integer("department_id"),
  description: text("description"),
  requirements: text("requirements"),
  type: text("type").notNull().default("full_time"),
  location: text("location"),
  salaryMin: numeric("salary_min", { precision: 12, scale: 2 }),
  salaryMax: numeric("salary_max", { precision: 12, scale: 2 }),
  status: text("status").notNull().default("open"),
  postedBy: text("posted_by"),
  closingDate: date("closing_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  candidateName: text("candidate_name").notNull(),
  candidateEmail: text("candidate_email").notNull(),
  phone: text("phone"),
  resumeUrl: text("resume_url"),
  coverLetter: text("cover_letter"),
  stage: text("stage").notNull().default("applied"),
  rating: integer("rating"),
  notes: text("notes"),
  source: text("source"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertJobPostingSchema = createInsertSchema(jobPostingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJobPosting = z.infer<typeof insertJobPostingSchema>;
export type JobPosting = typeof jobPostingsTable.$inferSelect;

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
