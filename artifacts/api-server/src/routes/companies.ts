import { Router } from "express";
import { db } from "@workspace/db";
import {
  companiesTable, subscriptionsTable, invitationsTable, usersTable, employeesTable, departmentsTable
} from "@workspace/db";
import { eq, desc, and, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendInviteEmail } from "../lib/mailer.js";

const router = Router();
const JWT_SECRET = process.env["SESSION_SECRET"] ?? "hrpay-secret-dev";

function requireAuth(req: any, res: any): { id: number; email: string; name: string; role: string; companyId: number | null } | null {
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Not authenticated" }); return null; }
  try {
    return jwt.verify(auth.slice(7), JWT_SECRET) as any;
  } catch {
    res.status(401).json({ error: "Invalid token" }); return null;
  }
}

const PLAN_PRICES: Record<string, { monthly: number; yearly: number; seats: number }> = {
  free:    { monthly: 0,  yearly: 0,   seats: 5 },
  starter: { monthly: 29, yearly: 290, seats: 50 },
  pro:     { monthly: 99, yearly: 990, seats: 999 },
};

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + crypto.randomBytes(3).toString("hex");
}

function generateToken() { return crypto.randomBytes(32).toString("hex"); }

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("") + "!1";
}

/* ───────── Public: Register Company ───────── */
router.post("/companies/register", async (req, res) => {
  const { companyName, industry, size, adminName, adminEmail, adminPassword, plan = "free", billingCycle = "monthly" } = req.body as {
    companyName: string; industry?: string; size?: string;
    adminName: string; adminEmail: string; adminPassword: string;
    plan?: string; billingCycle?: string;
  };

  if (!companyName || !adminName || !adminEmail || !adminPassword) {
    res.status(400).json({ error: "companyName, adminName, adminEmail, adminPassword required" }); return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail.toLowerCase()));
  if (existing) { res.status(409).json({ error: "Email already registered" }); return; }

  const slug = generateSlug(companyName);
  const [company] = await db.insert(companiesTable).values({
    name: companyName, slug, industry, size, plan,
    trialEndsAt: plan === "free" ? undefined : new Date(Date.now() + 14 * 86400000),
  }).returning();

  const planInfo = PLAN_PRICES[plan] ?? PLAN_PRICES.free;
  await db.insert(subscriptionsTable).values({
    companyId: company.id,
    plan,
    billingCycle,
    status: "active",
    seats: planInfo.seats,
    monthlyPrice: planInfo.monthly.toString(),
    startDate: new Date(),
    endDate: plan === "free" ? undefined : new Date(Date.now() + (billingCycle === "yearly" ? 365 : 30) * 86400000),
  });

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const [user] = await db.insert(usersTable).values({
    email: adminEmail.toLowerCase(), passwordHash, name: adminName,
    role: "company_admin", companyId: company.id,
  }).returning();

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.companyId },
    JWT_SECRET, { expiresIn: "7d" }
  );
  res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.companyId }, company });
});

/* ───────── Super Admin: List All Companies ───────── */
router.get("/companies", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;
  if (user.role !== "super_admin") { res.status(403).json({ error: "Forbidden" }); return; }

  const companies = await db.select().from(companiesTable).orderBy(desc(companiesTable.createdAt));
  const subs = await db.select().from(subscriptionsTable);
  const users = await db.select({ id: usersTable.id, companyId: usersTable.companyId }).from(usersTable);
  const employees = await db.select({ id: employeesTable.id, companyId: employeesTable.companyId }).from(employeesTable);

  const result = companies.map(c => ({
    ...c,
    subscription: subs.find(s => s.companyId === c.id),
    userCount: users.filter(u => u.companyId === c.id).length,
    employeeCount: employees.filter(e => e.companyId === c.id).length,
  }));
  res.json(result);
});

/* ───────── Super Admin: Update Company ───────── */
router.patch("/companies/:id", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;
  if (user.role !== "super_admin") { res.status(403).json({ error: "Forbidden" }); return; }

  const id = parseInt(req.params.id);
  const { plan, status, billingCycle } = (req.body ?? {}) as { plan?: string; status?: string; billingCycle?: string };

  const updates: any = { updatedAt: new Date() };
  if (plan) updates.plan = plan;
  if (status) updates.status = status;

  const [company] = await db.update(companiesTable).set(updates).where(eq(companiesTable.id, id)).returning();

  if (plan) {
    const planInfo = PLAN_PRICES[plan] ?? PLAN_PRICES.free;
    const [existingSub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.companyId, id));
    if (existingSub) {
      await db.update(subscriptionsTable).set({
        plan, seats: planInfo.seats, monthlyPrice: planInfo.monthly.toString(),
        billingCycle: billingCycle ?? existingSub.billingCycle,
        updatedAt: new Date(),
      }).where(eq(subscriptionsTable.companyId, id));
    } else {
      await db.insert(subscriptionsTable).values({
        companyId: id, plan, billingCycle: billingCycle ?? "monthly",
        status: "active", seats: planInfo.seats, monthlyPrice: planInfo.monthly.toString(),
      });
    }
  }
  res.json(company);
});

/* ───────── Company Admin: Get Own Company ───────── */
router.get("/companies/mine", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;
  if (!user.companyId) { res.status(403).json({ error: "Not associated with a company" }); return; }

  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, user.companyId));
  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.companyId, user.companyId));
  const members = await db.select({
    id: usersTable.id, name: usersTable.name, email: usersTable.email,
    role: usersTable.role, isActive: usersTable.isActive, createdAt: usersTable.createdAt,
  }).from(usersTable).where(eq(usersTable.companyId, user.companyId));
  const invitations = await db.select().from(invitationsTable)
    .where(and(eq(invitationsTable.companyId, user.companyId)));

  res.json({ company, subscription: sub, members, invitations });
});

/* ───────── Company Admin: Invite Member ───────── */
router.post("/companies/invite", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;
  const allowedRoles = ["company_admin", "ceoo", "manager", "supervisor", "super_admin"];
  if (!allowedRoles.includes(user.role)) { res.status(403).json({ error: "Insufficient permissions" }); return; }
  if (!user.companyId) { res.status(403).json({ error: "Not associated with a company" }); return; }

  const { email, name, role = "employee" } = req.body as { email: string; name: string; role?: string };
  if (!email || !name) { res.status(400).json({ error: "email and name required" }); return; }

  const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (existingUser) { res.status(409).json({ error: "Email already registered" }); return; }

  const [existingInvite] = await db.select().from(invitationsTable)
    .where(and(eq(invitationsTable.email, email.toLowerCase()), eq(invitationsTable.companyId, user.companyId)));
  if (existingInvite && existingInvite.status === "pending") {
    res.status(409).json({ error: "Invitation already sent to this email" }); return;
  }

  const tempPassword = generatePassword();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 86400000);

  const [invitation] = await db.insert(invitationsTable).values({
    companyId: user.companyId, email: email.toLowerCase(), name, role,
    token, tempPassword, status: "pending", invitedBy: user.id, expiresAt,
  }).returning();

  // Auto-create the user account immediately so they can log in with the temp password right away
  // without needing to visit an accept-invite URL first.
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  await db.insert(usersTable).values({
    email: email.toLowerCase(), passwordHash, name, role, companyId: user.companyId,
  }).catch(() => { /* user might already exist — login will still work */ });

  // Send email asynchronously — never block the response on it
  const [company] = await db.select({ name: companiesTable.name }).from(companiesTable).where(eq(companiesTable.id, user.companyId));
  const domains = (process.env["REPLIT_DOMAINS"] ?? "").split(",");
  const appDomain = domains[0]?.trim() || "localhost";
  const loginUrl = `https://${appDomain}/login`;

  sendInviteEmail({
    toEmail: email.toLowerCase(),
    toName: name,
    companyName: company?.name ?? "Your Company",
    tempPassword,
    loginUrl,
    invitedByName: user.name,
    role,
  }).catch(() => { /* email failure never breaks the invite */ });

  res.status(201).json({ invitation, tempPassword, acceptUrl: `/accept-invite?token=${token}` });
});

/* ───────── Company Admin: Update Member Role ───────── */
router.patch("/companies/members/:userId", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;
  const allowedRoles = ["company_admin", "super_admin"];
  if (!allowedRoles.includes(user.role)) { res.status(403).json({ error: "Insufficient permissions" }); return; }

  const targetId = parseInt(req.params.userId);
  const { role, isActive } = (req.body ?? {}) as { role?: string; isActive?: boolean };

  const updates: any = { updatedAt: new Date() };
  if (role) updates.role = role;
  if (typeof isActive === "boolean") updates.isActive = isActive;

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, targetId)).returning();
  res.json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role, isActive: updated.isActive });
});

/* ───────── Accept Invitation ───────── */
router.post("/auth/accept-invite", async (req, res) => {
  const { token } = req.body as { token: string };
  if (!token) { res.status(400).json({ error: "Token required" }); return; }

  const [invite] = await db.select().from(invitationsTable).where(eq(invitationsTable.token, token));
  if (!invite) { res.status(404).json({ error: "Invitation not found" }); return; }
  if (new Date() > invite.expiresAt && invite.status === "pending") {
    await db.update(invitationsTable).set({ status: "expired" }).where(eq(invitationsTable.id, invite.id));
    res.status(400).json({ error: "Invitation expired" }); return;
  }

  const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.email, invite.email));

  // If user already exists (pre-created at invite time), just log them in
  if (existingUser) {
    await db.update(invitationsTable).set({ status: "accepted", acceptedAt: new Date() }).where(eq(invitationsTable.id, invite.id));
    const jwtToken = jwt.sign(
      { id: existingUser.id, email: existingUser.email, name: existingUser.name, role: existingUser.role, companyId: existingUser.companyId },
      JWT_SECRET, { expiresIn: "7d" }
    );
    res.json({ token: jwtToken, user: { id: existingUser.id, email: existingUser.email, name: existingUser.name, role: existingUser.role, companyId: existingUser.companyId } });
    return;
  }

  // Fallback: create user if not yet pre-created
  const passwordHash = await bcrypt.hash(invite.tempPassword!, 10);
  const [newUser] = await db.insert(usersTable).values({
    email: invite.email, passwordHash, name: invite.name,
    role: invite.role, companyId: invite.companyId,
  }).returning();

  await db.update(invitationsTable).set({ status: "accepted", acceptedAt: new Date() }).where(eq(invitationsTable.id, invite.id));

  const jwtToken = jwt.sign(
    { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role, companyId: newUser.companyId },
    JWT_SECRET, { expiresIn: "7d" }
  );
  res.json({ token: jwtToken, user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role, companyId: newUser.companyId } });
});

/* ───────── Get Invitation Info (public) ───────── */
router.get("/auth/invite/:token", async (req, res) => {
  const [invite] = await db.select().from(invitationsTable).where(eq(invitationsTable.token, req.params.token));
  if (!invite) { res.status(404).json({ error: "Invitation not found" }); return; }
  const [company] = await db.select({ name: companiesTable.name }).from(companiesTable).where(eq(companiesTable.id, invite.companyId));
  res.json({ email: invite.email, name: invite.name, role: invite.role, status: invite.status, companyName: company?.name, expiresAt: invite.expiresAt });
});

/* ───────── Company Admin: Get Feature + Power Permissions ───────── */
router.get("/companies/permissions", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;
  if (!user.companyId) { res.status(403).json({ error: "Not associated with a company" }); return; }

  const [company] = await db.select({ featurePermissions: companiesTable.featurePermissions })
    .from(companiesTable).where(eq(companiesTable.id, user.companyId));

  const DEFAULT_FEATURES = {
    ceoo:       { employees:true,  payroll:true,  time:true,  leave:true,  recruitment:true,  performance:true,  benefits:true,  onboarding:true,  departments:true,  announcements:true,  expenses:true,  assets:true,  training:true, "org-chart":true,  reports:true,  team:false },
    manager:    { employees:true,  payroll:false, time:true,  leave:true,  recruitment:true,  performance:true,  benefits:false, onboarding:true,  departments:true,  announcements:true,  expenses:true,  assets:true,  training:true, "org-chart":true,  reports:false, team:false },
    supervisor: { employees:true,  payroll:false, time:true,  leave:true,  recruitment:false, performance:false, benefits:false, onboarding:false, departments:false, announcements:true,  expenses:false, assets:false, training:true, "org-chart":true,  reports:false, team:false },
    employee:   { employees:false, payroll:false, time:true,  leave:true,  recruitment:false, performance:false, benefits:true,  onboarding:true,  departments:false, announcements:true,  expenses:true,  assets:false, training:true, "org-chart":true,  reports:false, team:false },
  };

  const DEFAULT_POWERS = {
    ceoo:       { manage_employees:true,  process_payroll:true,  approve_leave:true,  approve_time:true,  approve_expenses:true,  manage_departments:true,  manage_benefits:true,  manage_recruitment:true,  manage_performance:true,  manage_training:true,  manage_assets:true,  publish_announcements:true,  view_reports:true,  invite_members:true,  edit_settings:false, manage_permissions:false },
    manager:    { manage_employees:false, process_payroll:false, approve_leave:true,  approve_time:true,  approve_expenses:true,  manage_departments:false, manage_benefits:false, manage_recruitment:true,  manage_performance:true,  manage_training:true,  manage_assets:false, publish_announcements:true,  view_reports:true,  invite_members:false, edit_settings:false, manage_permissions:false },
    supervisor: { manage_employees:false, process_payroll:false, approve_leave:true,  approve_time:true,  approve_expenses:false, manage_departments:false, manage_benefits:false, manage_recruitment:false, manage_performance:false, manage_training:false, manage_assets:false, publish_announcements:true,  view_reports:false, invite_members:false, edit_settings:false, manage_permissions:false },
    employee:   { manage_employees:false, process_payroll:false, approve_leave:false, approve_time:false, approve_expenses:false, manage_departments:false, manage_benefits:false, manage_recruitment:false, manage_performance:false, manage_training:false, manage_assets:false, publish_announcements:false, view_reports:false, invite_members:false, edit_settings:false, manage_permissions:false },
  };

  const stored = company?.featurePermissions as { features?: Record<string, Record<string, boolean>>; powers?: Record<string, Record<string, boolean>> } | Record<string, Record<string, boolean>> | null;

  let storedFeatures: Record<string, Record<string, boolean>> | null = null;
  let storedPowers: Record<string, Record<string, boolean>> | null = null;

  if (stored && typeof stored === "object") {
    if ("features" in stored || "powers" in stored) {
      storedFeatures = (stored as any).features ?? null;
      storedPowers = (stored as any).powers ?? null;
    } else {
      storedFeatures = stored as Record<string, Record<string, boolean>>;
    }
  }

  const permissions = storedFeatures
    ? { ...DEFAULT_FEATURES, ...Object.fromEntries(Object.entries(storedFeatures).map(([role, feats]) => [role, { ...(DEFAULT_FEATURES as any)[role], ...feats }])) }
    : DEFAULT_FEATURES;

  const powers = storedPowers
    ? { ...DEFAULT_POWERS, ...Object.fromEntries(Object.entries(storedPowers).map(([role, pwrs]) => [role, { ...(DEFAULT_POWERS as any)[role], ...pwrs }])) }
    : DEFAULT_POWERS;

  res.json({ permissions, powers });
});

/* ───────── Company Admin: Update Feature + Power Permissions ───────── */
router.put("/companies/permissions", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;
  if (!user.companyId) { res.status(403).json({ error: "Not associated with a company" }); return; }
  if (!["company_admin", "super_admin"].includes(user.role)) { res.status(403).json({ error: "Only company admins can update permissions" }); return; }

  const { permissions, powers } = req.body as {
    permissions?: Record<string, Record<string, boolean>>;
    powers?: Record<string, Record<string, boolean>>;
  };

  if (!permissions && !powers) { res.status(400).json({ error: "permissions or powers required" }); return; }

  const [existing] = await db.select({ featurePermissions: companiesTable.featurePermissions })
    .from(companiesTable).where(eq(companiesTable.id, user.companyId));

  const current = (existing?.featurePermissions ?? {}) as Record<string, any>;
  const updated = {
    ...(current.features !== undefined || current.powers !== undefined ? current : {}),
    ...(permissions ? { features: permissions } : {}),
    ...(powers ? { powers } : {}),
  };

  if (!updated.features && permissions) updated.features = permissions;
  if (!updated.powers && powers) updated.powers = powers;

  await db.update(companiesTable).set({ featurePermissions: updated, updatedAt: new Date() })
    .where(eq(companiesTable.id, user.companyId));

  res.json({ ok: true });
});

/* ───────── Super Admin: Platform Stats ───────── */
router.get("/companies/stats", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;
  if (user.role !== "super_admin") { res.status(403).json({ error: "Forbidden" }); return; }

  const companies = await db.select().from(companiesTable);
  const subs = await db.select().from(subscriptionsTable);
  const users = await db.select({ id: usersTable.id, companyId: usersTable.companyId }).from(usersTable);

  const byPlan = { free: 0, starter: 0, pro: 0 };
  companies.forEach(c => { if (c.plan in byPlan) (byPlan as any)[c.plan]++; });

  const mrrFree = 0;
  const mrrStarter = byPlan.starter * 29;
  const mrrPro = byPlan.pro * 99;

  res.json({
    totalCompanies: companies.length,
    activeCompanies: companies.filter(c => c.status === "active").length,
    totalUsers: users.filter(u => u.companyId !== null).length,
    byPlan,
    mrr: mrrFree + mrrStarter + mrrPro,
    arr: (mrrFree + mrrStarter + mrrPro) * 12,
  });
});

export default router;
