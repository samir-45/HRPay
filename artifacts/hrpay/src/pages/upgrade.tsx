import React from "react";
import { useLocation } from "wouter";
import { useSubscription } from "@/components/subscription-context";
import {
  PLAN_LABELS, PLAN_PRICES, PLAN_HIGHLIGHTS, PLAN_ORDER, PLAN_COLORS,
  type PlanKey,
} from "@/lib/plan-features";
import type { FeatureKey } from "@/components/permissions-context";
import { FEATURE_LABELS } from "./permissions";
import { CheckCircle2, Lock, Zap, Crown, Rocket, ArrowRight } from "lucide-react";

const LIME = "hsl(82 80% 48%)";

const PLAN_ICONS: Record<PlanKey, React.ElementType> = {
  free: Zap,
  starter: Rocket,
  pro: Crown,
};

const PLAN_CTA: Record<PlanKey, string> = {
  free: "Current Plan",
  starter: "Upgrade to Starter",
  pro: "Upgrade to Pro",
};

export default function Upgrade() {
  const [location] = useLocation();
  const { plan: currentPlan } = useSubscription();

  const params = new URLSearchParams(location.split("?")[1] ?? "");
  const lockedFeature = params.get("feature") as FeatureKey | null;
  const featureInfo = lockedFeature ? (FEATURE_LABELS as any)[lockedFeature] : null;

  const PLAN_ORDER_TYPED: PlanKey[] = ["free", "starter", "pro"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        {featureInfo ? (
          <>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-xs font-semibold text-muted-foreground mb-4">
              <Lock className="h-3 w-3" /> Feature locked
            </div>
            <h2 className="text-2xl font-extrabold text-foreground mb-2">
              Unlock {featureInfo.label}
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {featureInfo.desc}. Upgrade your plan to get access to this and many more features.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-extrabold text-foreground mb-2">Choose the right plan</h2>
            <p className="text-sm text-muted-foreground">Scale your HR operations with the plan that fits your team.</p>
          </>
        )}
      </div>

      {/* Current plan banner */}
      <div className="rounded-2xl border border-border bg-white p-4 flex items-center gap-3 shadow-sm">
        <div className="flex size-9 items-center justify-center rounded-xl bg-muted">
          <Zap className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Your current plan</p>
          <p className="text-sm font-bold text-foreground capitalize">{PLAN_LABELS[currentPlan]} — {PLAN_PRICES[currentPlan]}</p>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLAN_ORDER_TYPED.map((plan) => {
          const info = PLAN_HIGHLIGHTS[plan];
          const Icon = PLAN_ICONS[plan];
          const isCurrent = plan === currentPlan;
          const isHigher = PLAN_ORDER.indexOf(plan) > PLAN_ORDER.indexOf(currentPlan);
          const isPro = plan === "pro";

          return (
            <div key={plan}
              className={`relative rounded-2xl border p-6 shadow-sm flex flex-col ${isPro ? "border-foreground" : "border-border bg-white"}`}
              style={isPro ? { background: "hsl(220 15% 10%)" } : {}}>
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold text-foreground" style={{ background: LIME }}>Most Popular</span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`flex size-9 items-center justify-center rounded-xl ${isPro ? "bg-white/10" : "bg-muted"}`}>
                  <Icon className={`h-4 w-4 ${isPro ? "text-white" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${isPro ? "text-white" : "text-foreground"}`}>{PLAN_LABELS[plan]}</p>
                  <p className={`text-xs font-semibold ${isPro ? "text-white/60" : "text-muted-foreground"}`}>{PLAN_PRICES[plan]}</p>
                </div>
              </div>

              <p className={`text-xs font-bold mb-3 ${isPro ? "text-white/60" : "text-muted-foreground"}`}>{info.title}</p>

              <ul className="space-y-2 flex-1 mb-6">
                {info.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${isPro ? "text-lime-400" : "text-emerald-500"}`} />
                    <span className={isPro ? "text-white/80" : "text-foreground"}>{item}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className={`w-full py-2.5 rounded-xl text-xs font-bold text-center ${isPro ? "bg-white/10 text-white/60" : "bg-muted text-muted-foreground"}`}>
                  Current Plan
                </div>
              ) : isHigher ? (
                <button
                  className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
                  style={isPro ? { background: LIME, color: "hsl(220 15% 10%)" } : { background: "hsl(220 15% 10%)", color: "white" }}
                >
                  {PLAN_CTA[plan]} <ArrowRight className="h-3 w-3" />
                </button>
              ) : (
                <div className={`w-full py-2.5 rounded-xl text-xs font-bold text-center opacity-40 ${isPro ? "bg-white/10 text-white/60" : "bg-muted text-muted-foreground"}`}>
                  Downgrade
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Feature comparison note */}
      <div className="rounded-2xl bg-muted/40 border border-border p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-1">How subscription limits work</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Features locked to a higher plan are visible in the sidebar with an upgrade badge.</li>
          <li>All active users in your company share the same plan.</li>
          <li>Upgrading takes effect immediately — no downtime.</li>
          <li>Contact your account manager for annual billing discounts.</li>
        </ul>
      </div>
    </div>
  );
}
