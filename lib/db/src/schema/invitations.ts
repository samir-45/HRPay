import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { usersTable } from "./auth";

export const invitationsTable = pgTable("invitations", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companiesTable.id),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("employee"),
  token: text("token").notNull().unique(),
  tempPassword: text("temp_password"),
  status: text("status").notNull().default("pending"),
  invitedBy: integer("invited_by").references(() => usersTable.id),
  acceptedAt: timestamp("accepted_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInvitationSchema = createInsertSchema(invitationsTable).omit({ id: true, createdAt: true });
export type Invitation = typeof invitationsTable.$inferSelect;
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
