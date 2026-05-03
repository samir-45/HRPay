import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const attendanceDevicesTable = pgTable("attendance_devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  brand: text("brand"),
  deviceType: text("device_type"),
  connectionMethod: text("connection_method"),
  configJson: text("config_json"),
  location: text("location"),
  deviceRole: text("device_role").default("both"),
  webhookToken: text("webhook_token"),
  status: text("status").default("offline"),
  lastSyncAt: timestamp("last_sync_at"),
  punchesToday: integer("punches_today").default(0),
  companyId: integer("company_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const devicePunchLogsTable = pgTable("device_punch_logs", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id"),
  rawPayload: text("raw_payload"),
  employeeId: integer("employee_id"),
  punchTime: timestamp("punch_time"),
  punchType: text("punch_type"),
  method: text("method"),
  isProcessed: boolean("is_processed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAttendanceDeviceSchema = createInsertSchema(attendanceDevicesTable).omit({ id: true, createdAt: true });
export const insertDevicePunchLogSchema = createInsertSchema(devicePunchLogsTable).omit({ id: true, createdAt: true });
export type AttendanceDevice = typeof attendanceDevicesTable.$inferSelect;
export type DevicePunchLog = typeof devicePunchLogsTable.$inferSelect;
export type InsertAttendanceDevice = z.infer<typeof insertAttendanceDeviceSchema>;
