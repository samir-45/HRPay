import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth, apiHeaders } from "./auth-context";
import { useSubscription } from "./subscription-context";

export type FeatureKey =
  | "employees" | "payroll" | "time" | "leave" | "recruitment" | "performance"
  | "benefits" | "onboarding" | "departments" | "announcements" | "expenses"
  | "assets" | "training" | "org-chart" | "reports" | "team";

export type RoleKey = "ceoo" | "manager" | "supervisor" | "employee";

export type PowerKey =
  | "manage_employees"
  | "process_payroll"
  | "approve_leave"
  | "approve_time"
  | "approve_expenses"
  | "manage_departments"
  | "manage_benefits"
  | "manage_recruitment"
  | "manage_performance"
  | "manage_training"
  | "manage_assets"
  | "publish_announcements"
  | "view_reports"
  | "invite_members"
  | "edit_settings"
  | "manage_permissions";

export type PermissionsMap = Record<RoleKey, Record<FeatureKey, boolean>>;
export type PowerPermissionsMap = Record<RoleKey, Record<PowerKey, boolean>>;

export const ALL_FEATURES: FeatureKey[] = [
  "employees","payroll","time","leave","recruitment","performance",
  "benefits","onboarding","departments","announcements","expenses",
  "assets","training","org-chart","reports","team",
];

export const ALL_POWERS: PowerKey[] = [
  "manage_employees","process_payroll","approve_leave","approve_time","approve_expenses",
  "manage_departments","manage_benefits","manage_recruitment","manage_performance",
  "manage_training","manage_assets","publish_announcements","view_reports",
  "invite_members","edit_settings","manage_permissions",
];

export const DEFAULT_PERMISSIONS: PermissionsMap = {
  ceoo:       { employees:true,  payroll:true,  time:true,  leave:true,  recruitment:true,  performance:true,  benefits:true,  onboarding:true,  departments:true,  announcements:true,  expenses:true,  assets:true,  training:true, "org-chart":true,  reports:true,  team:false },
  manager:    { employees:true,  payroll:false, time:true,  leave:true,  recruitment:true,  performance:true,  benefits:false, onboarding:true,  departments:true,  announcements:true,  expenses:true,  assets:true,  training:true, "org-chart":true,  reports:false, team:false },
  supervisor: { employees:true,  payroll:false, time:true,  leave:true,  recruitment:false, performance:false, benefits:false, onboarding:false, departments:false, announcements:true,  expenses:false, assets:false, training:true, "org-chart":true,  reports:false, team:false },
  employee:   { employees:false, payroll:false, time:true,  leave:true,  recruitment:false, performance:false, benefits:true,  onboarding:true,  departments:false, announcements:true,  expenses:true,  assets:false, training:true, "org-chart":true,  reports:false, team:false },
};

export const DEFAULT_POWERS: PowerPermissionsMap = {
  ceoo:       { manage_employees:true,  process_payroll:true,  approve_leave:true,  approve_time:true,  approve_expenses:true,  manage_departments:true,  manage_benefits:true,  manage_recruitment:true,  manage_performance:true,  manage_training:true,  manage_assets:true,  publish_announcements:true,  view_reports:true,  invite_members:true,  edit_settings:false, manage_permissions:false },
  manager:    { manage_employees:false, process_payroll:false, approve_leave:true,  approve_time:true,  approve_expenses:true,  manage_departments:false, manage_benefits:false, manage_recruitment:true,  manage_performance:true,  manage_training:true,  manage_assets:false, publish_announcements:true,  view_reports:true,  invite_members:false, edit_settings:false, manage_permissions:false },
  supervisor: { manage_employees:false, process_payroll:false, approve_leave:true,  approve_time:true,  approve_expenses:false, manage_departments:false, manage_benefits:false, manage_recruitment:false, manage_performance:false, manage_training:false, manage_assets:false, publish_announcements:true,  view_reports:false, invite_members:false, edit_settings:false, manage_permissions:false },
  employee:   { manage_employees:false, process_payroll:false, approve_leave:false, approve_time:false, approve_expenses:false, manage_departments:false, manage_benefits:false, manage_recruitment:false, manage_performance:false, manage_training:false, manage_assets:false, publish_announcements:false, view_reports:false, invite_members:false, edit_settings:false, manage_permissions:false },
};

export const POWER_TO_FEATURE: Record<string, FeatureKey> = {
  manage_employees: "employees",
  process_payroll: "payroll",
  approve_leave: "leave",
  approve_time: "time",
  approve_expenses: "expenses",
  manage_departments: "departments",
  manage_benefits: "benefits",
  manage_recruitment: "recruitment",
  manage_performance: "performance",
  manage_training: "training",
  manage_assets: "assets",
  publish_announcements: "announcements",
  view_reports: "reports",
  invite_members: "team",
};

interface PermissionsContextValue {
  permissions: PermissionsMap;
  powers: PowerPermissionsMap;
  isLoading: boolean;
  hasFeature: (feature: FeatureKey) => boolean;
  hasPower: (power: PowerKey) => boolean;
  refetch: () => void;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  permissions: DEFAULT_PERMISSIONS,
  powers: DEFAULT_POWERS,
  isLoading: false,
  hasFeature: () => true,
  hasPower: () => true,
  refetch: () => {},
});

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [permissions, setPermissions] = useState<PermissionsMap>(DEFAULT_PERMISSIONS);
  const [powers, setPowers] = useState<PowerPermissionsMap>(DEFAULT_POWERS);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPermissions = useCallback(async () => {
    if (!user?.companyId) return;
    setIsLoading(true);
    try {
      const r = await fetch("/api/companies/permissions", { headers: apiHeaders(token) });
      if (r.ok) {
        const data = await r.json() as { permissions: PermissionsMap; powers: PowerPermissionsMap };
        if (data.permissions) setPermissions(data.permissions);
        if (data.powers) setPowers(data.powers);
      }
    } catch { }
    setIsLoading(false);
  }, [user?.companyId, token]);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  const { planHasFeature } = useSubscription();
  const hasFeature = useCallback((feature: FeatureKey): boolean => {
    if (!user) return false;

    // Super admin always has all features
    if (user.role === "super_admin") return true;

    // Check if the current plan supports this feature
    if (!planHasFeature(feature)) return false;

    // Company admin has all features supported by the plan
    if (user.role === "company_admin") return true;

    // Other roles follow role-based permissions, but still restricted by plan
    const role = user.role as RoleKey;
    if (!permissions[role]) return true;
    return permissions[role][feature] ?? true;
  }, [user, permissions, planHasFeature]);

  const hasPower = useCallback((power: PowerKey): boolean => {
    if (!user) return false;

    // Super admin always has all powers
    if (user.role === "super_admin") return true;

    // If power is linked to a feature, check the plan first
    const feature = POWER_TO_FEATURE[power];
    if (feature && !planHasFeature(feature)) return false;

    // Company admin has all powers allowed by the plan
    if (user.role === "company_admin") return true;

    // Other roles follow role-based power permissions
    const role = user.role as RoleKey;
    if (!powers[role]) return false;
    return powers[role][power] ?? false;
  }, [user, powers, planHasFeature]);

  return (
    <PermissionsContext.Provider value={{ permissions, powers, isLoading, hasFeature, hasPower, refetch: fetchPermissions }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() { return useContext(PermissionsContext); }
