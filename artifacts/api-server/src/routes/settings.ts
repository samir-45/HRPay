import { Router } from "express";
import { db } from "@workspace/db";
import { companiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireCompanyUser } from "../lib/auth-helpers";

const router = Router();

interface CompanySettings {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  registrationNumber?: string;
  fiscalYearStart?: string;
  timezone?: string;
  currency?: string;
  dateFormat?: string;
  logoUrl?: string;
  payPeriod?: string;
  workingHoursPerDay?: number;
  workingDaysPerWeek?: number;
}

const DEFAULT_SETTINGS: CompanySettings = {
  fiscalYearStart: "January",
  timezone: "UTC",
  currency: "USD",
  dateFormat: "MM/DD/YYYY",
  payPeriod: "bi-weekly",
  workingHoursPerDay: 8,
  workingDaysPerWeek: 5,
};

router.get("/settings", async (req, res) => {
  const user = requireCompanyUser(req, res);
  if (!user) return;

  const [company] = await db
    .select({
      id: companiesTable.id,
      name: companiesTable.name,
      country: companiesTable.country,
      logoUrl: companiesTable.logoUrl,
      settings: companiesTable.settings,
    })
    .from(companiesTable)
    .where(eq(companiesTable.id, user.companyId));

  if (!company) {
    res.status(404).json({ error: "Company not found" });
    return;
  }

  const stored = (company.settings ?? {}) as CompanySettings;
  const merged: CompanySettings = {
    ...DEFAULT_SETTINGS,
    name: company.name,
    logoUrl: company.logoUrl ?? "",
    ...stored,
  };

  res.json(merged);
});

router.patch("/settings", async (req, res) => {
  const user = requireCompanyUser(req, res);
  if (!user) return;

  const {
    name, email, phone, address, website, registrationNumber,
    fiscalYearStart, timezone, currency, dateFormat, logoUrl,
    payPeriod, workingHoursPerDay, workingDaysPerWeek,
  } = req.body as CompanySettings;

  const [company] = await db
    .select({ settings: companiesTable.settings, name: companiesTable.name })
    .from(companiesTable)
    .where(eq(companiesTable.id, user.companyId));

  if (!company) {
    res.status(404).json({ error: "Company not found" });
    return;
  }

  const existing = (company.settings ?? {}) as CompanySettings;
  const newSettings: CompanySettings = {
    ...existing,
    ...(email !== undefined && { email }),
    ...(phone !== undefined && { phone }),
    ...(address !== undefined && { address }),
    ...(website !== undefined && { website }),
    ...(registrationNumber !== undefined && { registrationNumber }),
    ...(fiscalYearStart !== undefined && { fiscalYearStart }),
    ...(timezone !== undefined && { timezone }),
    ...(currency !== undefined && { currency }),
    ...(dateFormat !== undefined && { dateFormat }),
    ...(payPeriod !== undefined && { payPeriod }),
    ...(workingHoursPerDay !== undefined && { workingHoursPerDay }),
    ...(workingDaysPerWeek !== undefined && { workingDaysPerWeek }),
  };

  const companyUpdates: Record<string, unknown> = { settings: newSettings, updatedAt: new Date() };
  if (name) companyUpdates.name = name;
  if (logoUrl !== undefined) companyUpdates.logoUrl = logoUrl;

  const [updated] = await db
    .update(companiesTable)
    .set(companyUpdates)
    .where(eq(companiesTable.id, user.companyId))
    .returning({ id: companiesTable.id, name: companiesTable.name, logoUrl: companiesTable.logoUrl, settings: companiesTable.settings });

  const merged: CompanySettings = {
    ...DEFAULT_SETTINGS,
    name: updated.name,
    logoUrl: updated.logoUrl ?? "",
    ...((updated.settings ?? {}) as CompanySettings),
  };

  res.json(merged);
});

export default router;
