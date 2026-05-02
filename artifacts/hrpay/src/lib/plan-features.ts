import type { FeatureKey } from "@/components/permissions-context";

export type PlanKey = "free" | "starter" | "pro";

export const PLAN_ORDER: PlanKey[] = ["free", "starter", "pro"];

export const PLAN_LABELS: Record<PlanKey, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
};

export const PLAN_PRICES: Record<PlanKey, string> = {
  free: "$0 / mo",
  starter: "$29 / mo",
  pro: "$99 / mo",
};

export const PLAN_COLORS: Record<PlanKey, string> = {
  free: "bg-muted text-muted-foreground",
  starter: "bg-blue-100 text-blue-700",
  pro: "bg-violet-100 text-violet-700",
};

export const PLAN_FEATURES: Record<PlanKey, FeatureKey[]> = {
  free: [
    "employees", "time", "leave", "announcements", "org-chart", "onboarding",
  ],
  starter: [
    "employees", "time", "leave", "announcements", "org-chart", "onboarding",
    "payroll", "benefits", "departments", "expenses", "training", "assets", "team",
  ],
  pro: [
    "employees", "time", "leave", "announcements", "org-chart", "onboarding",
    "payroll", "benefits", "departments", "expenses", "training", "assets", "team",
    "recruitment", "performance", "reports",
  ],
};

export const FEATURE_MIN_PLAN: Record<FeatureKey, PlanKey> = {
  employees:     "free",
  time:          "free",
  leave:         "free",
  announcements: "free",
  "org-chart":   "free",
  onboarding:    "free",
  payroll:       "starter",
  benefits:      "starter",
  departments:   "starter",
  expenses:      "starter",
  training:      "starter",
  assets:        "starter",
  team:          "starter",
  recruitment:   "pro",
  performance:   "pro",
  reports:       "pro",
};

export function planIncludes(plan: string, feature: FeatureKey): boolean {
  const p = (PLAN_FEATURES[plan as PlanKey] ?? PLAN_FEATURES.free);
  return p.includes(feature);
}

export function requiredPlanFor(feature: FeatureKey): PlanKey {
  return FEATURE_MIN_PLAN[feature] ?? "free";
}

export const PLAN_HIGHLIGHTS: Record<PlanKey, { title: string; items: string[] }> = {
  free: {
    title: "Get Started",
    items: [
      "Up to 5 employees",
      "Time & Attendance tracking",
      "Leave management",
      "Company announcements",
      "Org chart view",
      "Employee onboarding tasks",
    ],
  },
  starter: {
    title: "Core HR",
    items: [
      "Up to 50 employees",
      "Everything in Free",
      "Full payroll processing",
      "Benefits management",
      "Department management",
      "Expense reporting",
      "Training & learning",
      "Asset tracking",
      "Team management & invites",
    ],
  },
  pro: {
    title: "Full Platform",
    items: [
      "Unlimited employees",
      "Everything in Starter",
      "Recruitment & ATS",
      "Performance reviews",
      "Advanced HR reports",
      "Priority support",
    ],
  },
};
