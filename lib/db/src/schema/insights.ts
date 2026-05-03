import { pgTable, serial, text, integer, timestamp, date, jsonb } from "drizzle-orm/pg-core";

export const companyInsightsTable = pgTable("company_insights", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  weekOf: date("week_of").notNull(),
  summary: text("summary"),
  score: integer("score"),
  insights: jsonb("insights"),
  status: text("status").notNull().default("completed"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});
