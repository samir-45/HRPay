import { pgTable, serial, text, numeric, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const assetsTable = pgTable("assets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().default("other"),
  brand: text("brand"),
  model: text("model"),
  serialNumber: text("serial_number"),
  purchaseDate: date("purchase_date"),
  purchaseCost: numeric("purchase_cost", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("available"),
  assignedTo: integer("assigned_to"),
  assignedAt: timestamp("assigned_at"),
  location: text("location"),
  warrantyExpiry: date("warranty_expiry"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAssetSchema = createInsertSchema(assetsTable).omit({ id: true, createdAt: true });
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assetsTable.$inferSelect;
