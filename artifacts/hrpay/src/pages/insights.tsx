import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, apiHeaders } from "@/components/auth-context";
import {
  Sparkles, RefreshCw, TrendingUp, TrendingDown, Minus,
  Users, Calculator, CalendarDays, Receipt, ListTodo,
  Briefcase, Target, Clock, AlertTriangle, CheckCircle,
  Info, Zap, ToggleLeft, ToggleRight, ChevronRight,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";

const API = "/api";
const LIME = "hsl(82 80% 48%)";

interface InsightItem {
  category: string;
  status: "good" | "warning" | "alert" | "info";
  title: string;
  detail: string;
  recommendation: string;
  metric?: string;
}

interface InsightRecord {
  id: number;
  companyId: number;
  weekOf: string;
  summary: string | null;
  score: number | null;
  insights: InsightItem[] | null;
  status: "generating" | "completed" | "failed";
  generatedAt: string;
}

interface InsightsResponse {
  enabled: boolean;
  latest: InsightRecord | null;
}

const STATUS_STYLES: Record<string, { bg: string; border: string; icon: React.ElementType; iconColor: string; badge: string; badgeText: string }> = {
  good:    { bg: "bg-emerald-50",  border: "border-emerald-200", icon: CheckCircle,  iconColor: "text-emerald-500", badge: "bg-emerald-100 text-emerald-700", badgeText: "Healthy" },
  warning: { bg: "bg-amber-50",    border: "border-amber-200",   icon: AlertTriangle, iconColor: "text-amber-500",   badge: "bg-amber-100 text-amber-700",   badgeText: "Attention" },
  alert:   { bg: "bg-red-50",      border: "border-red-200",     icon: AlertTriangle, iconColor: "text-red-500",     badge: "bg-red-100 text-red-700",       badgeText: "Urgent" },
  info:    { bg: "bg-blue-50",     border: "border-blue-200",    icon: Info,          iconColor: "text-blue-500",    badge: "bg-blue-100 text-blue-700",     badgeText: "Info" },
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Headcount": Users,
  "Payroll": Calculator,
  "Leave & Time Off": CalendarDays,
  "Expenses": Receipt,
  "Onboarding": ListTodo,
  "Recruitment": Briefcase,
  "Performance": Target,
  "Time & Attendance": Clock,
};

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "hsl(82 80% 42%)" : score >= 60 ? "hsl(38 92% 50%)" : "hsl(0 72% 51%)";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(220 15% 92%)" strokeWidth="10" />
        <circle cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground font-medium">Health Score</span>
      </div>
    </div>
  );
}

function InsightCard({ item }: { item: InsightItem }) {
  const s = STATUS_STYLES[item.status] ?? STATUS_STYLES.info;
  const Icon = CATEGORY_ICONS[item.category] ?? Info;
  const StatusIcon = s.icon;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-2xl border p-5 transition-all ${s.bg} ${s.border}`}>
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm">
          <Icon className="h-4.5 w-4.5 text-foreground/70" style={{ width: 18, height: 18 }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.badge}`}>{s.badgeText}</span>
            <span className="text-xs text-muted-foreground">{item.category}</span>
            {item.metric && (
              <span className="ml-auto text-xs font-semibold text-foreground bg-white/60 px-2 py-0.5 rounded-full border border-white/80">
                {item.metric}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-foreground text-sm leading-tight">{item.title}</h3>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{item.detail}</p>
          {expanded && (
            <div className="mt-3 pt-3 border-t border-black/10">
              <p className="text-xs font-semibold text-foreground/70 mb-1 uppercase tracking-wide">Recommendation</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{item.recommendation}</p>
            </div>
          )}
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 mt-2 text-xs font-medium text-foreground/60 hover:text-foreground/80 transition-colors"
          >
            {expanded ? "Less" : "See recommendation"}
            <ChevronRight className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
          </button>
        </div>
        <StatusIcon className={`h-4 w-4 shrink-0 ${s.iconColor}`} />
      </div>
    </div>
  );
}

function GeneratingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-white p-5 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-xl bg-muted/60 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <div className="h-5 w-16 rounded-full bg-muted/60" />
                <div className="h-5 w-20 rounded-full bg-muted/40" />
              </div>
              <div className="h-4 w-3/4 rounded bg-muted/60" />
              <div className="h-3 w-full rounded bg-muted/40" />
              <div className="h-3 w-2/3 rounded bg-muted/40" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Insights() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  const { data, isLoading } = useQuery<InsightsResponse>({
    queryKey: ["insights"],
    queryFn: () => fetch(`${API}/insights`, { headers: apiHeaders(token) }).then(r => r.json()),
    refetchInterval: generatingId ? 3000 : false,
  });

  const insight = data?.latest;
  const enabled = data?.enabled ?? true;
  const isGenerating = generatingId !== null || insight?.status === "generating";

  // Poll until done
  useEffect(() => {
    if (!generatingId) return;
    if (insight?.status === "completed" || insight?.status === "failed") {
      setGeneratingId(null);
      qc.invalidateQueries({ queryKey: ["insights"] });
    }
  }, [insight?.status, generatingId, qc]);

  const generate = useMutation({
    mutationFn: () => fetch(`${API}/insights/generate`, { method: "POST", headers: apiHeaders(token) }).then(r => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return; }
      setGeneratingId(data.id);
      qc.invalidateQueries({ queryKey: ["insights"] });
      toast.success("Generating insights…", { description: "This takes about 15 seconds." });
    },
    onError: () => toast.error("Failed to start generation"),
  });

  const toggleEnabled = useMutation({
    mutationFn: (val: boolean) => fetch(`${API}/insights/settings`, {
      method: "PATCH",
      headers: apiHeaders(token),
      body: JSON.stringify({ enabled: val }),
    }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["insights"] });
      toast.success(enabled ? "AI Insights disabled" : "AI Insights enabled");
    },
    onError: () => toast.error("Failed to update AI Insights setting", { description: "Please try again." }),
  });

  const scoreLabel = !insight?.score ? "" : insight.score >= 80 ? "Healthy" : insight.score >= 60 ? "Needs Attention" : "Critical";
  const weekLabel = insight?.weekOf ? `Week of ${new Date(insight.weekOf + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" style={{ color: LIME }} />
            <h2 className="text-xl font-bold text-foreground">Weekly AI Insights</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-powered analysis of your company's HR health, refreshed every Monday
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle */}
          <button
            onClick={() => toggleEnabled.mutate(!enabled)}
            className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
          >
            {enabled
              ? <ToggleRight className="h-4 w-4" style={{ color: LIME }} />
              : <ToggleLeft className="h-4 w-4 text-muted-foreground" />
            }
            {enabled ? "Enabled" : "Disabled"}
          </button>

          {/* Generate now */}
          <button
            onClick={() => generate.mutate()}
            disabled={isGenerating || generate.isPending || !enabled}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: LIME }}
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "Generating…" : "Generate Now"}
          </button>
        </div>
      </div>

      {/* Disabled state */}
      {!enabled && (
        <div className="rounded-2xl border border-border bg-white p-10 text-center">
          <ToggleLeft className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">AI Insights is turned off</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Enable it to receive weekly AI-powered analysis of your company's HR health.
          </p>
          <button
            onClick={() => toggleEnabled.mutate(true)}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-foreground"
            style={{ background: LIME }}
          >
            Enable AI Insights
          </button>
        </div>
      )}

      {/* Loading skeleton on first fetch */}
      {enabled && isLoading && <GeneratingSkeleton />}

      {/* Generating state */}
      {enabled && !isLoading && isGenerating && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-10 items-center justify-center rounded-xl" style={{ background: LIME + "30" }}>
                <Sparkles className="h-5 w-5" style={{ color: LIME }} />
              </div>
              <div>
                <p className="font-semibold text-foreground">Analyzing company data…</p>
                <p className="text-sm text-muted-foreground">AI is reviewing your HR metrics. This takes about 15 seconds.</p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
              <div className="h-full rounded-full animate-pulse" style={{ background: LIME, width: "60%" }} />
            </div>
          </div>
          <GeneratingSkeleton />
        </div>
      )}

      {/* No insights yet */}
      {enabled && !isLoading && !isGenerating && !insight && (
        <div className="rounded-2xl border border-border bg-white p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl mx-auto mb-4" style={{ background: LIME + "20" }}>
            <Sparkles className="h-7 w-7" style={{ color: LIME }} />
          </div>
          <h3 className="font-semibold text-foreground mb-1 text-lg">No insights generated yet</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
            Generate your first weekly insight report to see AI-powered analysis of your company's HR health.
          </p>
          <button
            onClick={() => generate.mutate()}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-foreground"
            style={{ background: LIME }}
          >
            <Sparkles className="inline h-4 w-4 mr-1.5" />
            Generate First Report
          </button>
        </div>
      )}

      {/* Insights display */}
      {enabled && !isLoading && !isGenerating && insight?.status === "completed" && insight.insights && (
        <>
          {/* Score + summary */}
          <div className="rounded-2xl border border-border bg-white p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            <ScoreRing score={insight.score ?? 0} />
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start">
                <span className="text-sm font-semibold text-muted-foreground">{weekLabel}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: LIME + "30", color: "hsl(82 60% 30%)" }}>
                  {scoreLabel}
                </span>
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">Executive Summary</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{insight.summary}</p>
              <p className="text-xs text-muted-foreground/60 mt-3">
                Generated {new Date(insight.generatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insight.insights.map((item, i) => <InsightCard key={i} item={item} />)}
          </div>

          {/* Score breakdown bar */}
          <div className="rounded-2xl border border-border bg-white p-5">
            <h4 className="text-sm font-semibold text-foreground mb-4">Health Score Breakdown</h4>
            <div className="space-y-3">
              {(["good", "info", "warning", "alert"] as const).map(status => {
                const count = insight.insights!.filter(i => i.status === status).length;
                const total = insight.insights!.length;
                const pct = total > 0 ? (count / total) * 100 : 0;
                const labels = { good: "Healthy", info: "Info", warning: "Needs Attention", alert: "Urgent" };
                const colors = { good: "bg-emerald-400", info: "bg-blue-400", warning: "bg-amber-400", alert: "bg-red-400" };
                if (count === 0) return null;
                return (
                  <div key={status} className="flex items-center gap-3 text-sm">
                    <span className="w-28 text-muted-foreground text-xs">{labels[status]}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted/40 overflow-hidden">
                      <div className={`h-full rounded-full ${colors[status]}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right text-xs font-medium text-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Failed state */}
      {enabled && !isLoading && insight?.status === "failed" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">Generation failed</h3>
          <p className="text-sm text-muted-foreground mb-4">Something went wrong while generating insights. Please try again.</p>
          <button onClick={() => generate.mutate()} className="rounded-xl px-4 py-2 text-sm font-semibold text-foreground" style={{ background: LIME }}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
