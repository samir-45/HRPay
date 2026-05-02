import { Router } from "express";

const router = Router();

/* In-memory company settings (extend with DB table as needed) */
const companySettings = {
  name: "Acme Corp",
  email: "hr@acmecorp.com",
  phone: "+1 (555) 000-0001",
  address: "123 Main St, San Francisco, CA 94102",
  website: "https://acmecorp.com",
  registrationNumber: "ACM-2019-001",
  fiscalYearStart: "January",
  timezone: "America/Los_Angeles",
  currency: "USD",
  dateFormat: "MM/DD/YYYY",
  logoUrl: "",
  payPeriod: "bi-weekly",
  workingHoursPerDay: 8,
  workingDaysPerWeek: 5,
};

router.get("/settings", (_req, res) => {
  res.json(companySettings);
});

router.patch("/settings", (req, res) => {
  Object.assign(companySettings, req.body);
  res.json(companySettings);
});

export default router;
