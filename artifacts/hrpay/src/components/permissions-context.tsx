import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth, apiHeaders } from "./auth-context";

export type FeatureKey =
  | "employees" | "payroll" | "time" | "leave" | "recruitment" | "performance"
  | "benefits" | "onboarding" | "departments" | "announcements" | "expenses"
  | "assets" | "training" | "org-chart" | "reports" | "team";

export type RoleKey = "ceoo" | "manager" | "supervisor" | "employee";

export type PermissionsMap = Record<RoleKey, Record<FeatureKey, boolean>>;

const ALL_FEATURES: FeatureKey[] = [
  "employees","payroll","time","leave","recruitment","performance",
  "benefits","onboarding","departments","announcements","expenses",
  "assets","training","org-chart","reports","team",
];

export const DEFAULT_PERMISSIONS: PermissionsMap = {
  ceoo:       { employees:true,  payroll:true,  time:true,  leave:true,  recruitment:true,  performance:true,  benefits:true,  onboarding:true,  departments:true,  announcements:true,  expenses:true,  assets:true,  training:true, "org-chart":true,  reports:true,  team:false },
  manager:    { employees:true,  payroll:false, time:true,  leave:true,  recruitment:true,  performance:true,  benefits:false, onboarding:true,  departments:true,  announcements:true,  expenses:true,  assets:true,  training:true, "org-chart":true,  reports:false, team:false },
  supervisor: { employees:true,  payroll:false, time:true,  leave:true,  recruitment:false, performance:false, benefits:false, onboarding:false, departments:false, announcements:true,  expenses:false, assets:false, training:true, "org-chart":true,  reports:false, team:false },
  employee:   { employees:false, payroll:false, time:true,  leave:true,  recruitment:false, performance:false, benefits:true,  onboarding:true,  departments:false, announcements:true,  expenses:true,  assets:false, training:true, "org-chart":true,  reports:false, team:false },
};

interface PermissionsContextValue {
  permissions: PermissionsMap;
  isLoading: boolean;
  hasFeature: (feature: FeatureKey) => boolean;
  refetch: () => void;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  permissions: DEFAULT_PERMISSIONS,
  isLoading: false,
  hasFeature: () => true,
  refetch: () => {},
});

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [permissions, setPermissions] = useState<PermissionsMap>(DEFAULT_PERMISSIONS);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPermissions = useCallback(async () => {
    if (!user?.companyId) return;
    setIsLoading(true);
    try {
      const r = await fetch("/api/companies/permissions", { headers: apiHeaders(token) });
      if (r.ok) {
        const data = await r.json() as { permissions: PermissionsMap };
        setPermissions(data.permissions ?? DEFAULT_PERMISSIONS);
      }
    } catch { }
    setIsLoading(false);
  }, [user?.companyId, token]);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  const hasFeature = useCallback((feature: FeatureKey): boolean => {
    if (!user) return false;
    if (user.role === "company_admin" || user.role === "super_admin") return true;
    const role = user.role as RoleKey;
    if (!permissions[role]) return true;
    return permissions[role][feature] ?? true;
  }, [user, permissions]);

  return (
    <PermissionsContext.Provider value={{ permissions, isLoading, hasFeature, refetch: fetchPermissions }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() { return useContext(PermissionsContext); }
export { ALL_FEATURES };
