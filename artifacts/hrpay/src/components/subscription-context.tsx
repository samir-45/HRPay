import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth, apiHeaders } from "./auth-context";
import type { FeatureKey } from "./permissions-context";
import { planIncludes, requiredPlanFor, type PlanKey } from "@/lib/plan-features";

interface SubscriptionContextValue {
  plan: PlanKey;
  isLoading: boolean;
  planHasFeature: (feature: FeatureKey) => boolean;
  requiredPlanFor: (feature: FeatureKey) => PlanKey;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  plan: "free",
  isLoading: false,
  planHasFeature: () => true,
  requiredPlanFor,
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [plan, setPlan] = useState<PlanKey>("free");
  const [isLoading, setIsLoading] = useState(false);

  const fetchPlan = useCallback(async () => {
    if (!user?.companyId) return;
    setIsLoading(true);
    try {
      const r = await fetch("/api/companies/mine", { headers: apiHeaders(token) });
      if (r.ok) {
        const data = await r.json() as { company: { plan: string } };
        setPlan((data.company?.plan ?? "free") as PlanKey);
      }
    } catch { }
    setIsLoading(false);
  }, [user?.companyId, token]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  const planHasFeature = useCallback((feature: FeatureKey) => {
    if (user?.role === "super_admin") return true;
    return planIncludes(plan, feature);
  }, [plan, user?.role]);

  return (
    <SubscriptionContext.Provider value={{ plan, isLoading, planHasFeature, requiredPlanFor }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() { return useContext(SubscriptionContext); }
