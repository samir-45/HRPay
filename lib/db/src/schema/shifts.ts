import { pgTable, serial, text, time, integer, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shiftsTable = pgTable("shifts", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  name: text("name").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  graceMinutes: integer("grace_minutes").default(10),
  breakMinutes: integer("break_minutes").default(30),
  workingDays: json("working_days").$type<string[]>(), // ["mon", "tue", ...]
  overtimeThreshold: numeric("overtime_threshold", { precision: 4, scale: 2 }).default("8"),
  color: text("color").default("#84cc16"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertShiftSchema = createInsertSchema(shiftsTable).omit({ id: true, createdAt: true });
export type Shift = typeof shiftsTable.$inferSelect;
export type InsertShift = z.infer<typeof insertShiftSchema>;
