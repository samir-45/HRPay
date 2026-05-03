import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, apiHeaders } from "@/components/auth-context";
import {
  LayoutDashboard, Building2, Users, CreditCard, Settings,
  Crown, LogOut, RefreshCw, Search, TrendingUp, DollarSign,
  CheckCircle2, XCircle, AlertTriangle, ChevronRight,
  BarChart3, ArrowUpRight, Shield, Bell, Zap, Layers,
  UserCheck, Ban, Eye, Edit2, Plus, Filter, Menu, X as XClose,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LIME = "hsl(82 80% 48%)";

/* ─── Types ─── */
interface Company {
  id: number; name: string; slug: string; plan: string; status: string;
  industry?: string; size?: string; createdAt: string;
  userCount: number; employeeCount: number;
  subscription?: { billingCycle: string; seats: number; monthlyPrice: string; startDate?: string };
}
interface Stats {
  totalCompanies: number; activeCompanies: number;
  totalUsers: number; byPlan: { free: number; starter: number; pro: number };
  mrr: number; arr: number;
}

/* ─── Helpers ─── */
function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
const PLAN_BADGE: Record<string, string> = {
  free: "bg-gray-100 text-gray-600",
  starter: "bg-blue-100 text-blue-700",
  pro: "bg-purple-100 text-purple-700",
};
const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  suspended: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-500",
};

/* ─── Shared Save Hook ─── */
function useCompanyPatch(token: string | null, onDone: () => void) {
  const [saving, setSaving] = useState(false);
  async function save(id: number, body: Record<string, unknown>) {
    setSaving(true);
    await fetch(`/api/companies/${id}`, {
      method: "PATCH",
      headers: apiHeaders(token),
      body: JSON.stringify(body),
    });
    await onDone();
    setSaving(false);
  }
  return { save, saving };
}

/* ══════════════════════════════════════════════════════
   PAGE: OVERVIEW
══════════════════════════════════════════════════════ */
function PageOverview({ stats, companies }: { stats: Stats | null; companies: Company[] }) {
  if (!stats) return <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>;

  const kpis = [
    { label: "Total Companies",  value: stats.totalCompanies,           sub: `${stats.activeCompanies} active`,      icon: Building2,  lime: false },
    { label: "Platform Users",   value: stats.totalUsers,               sub: "across all tenants",                   icon: Users,      lime: false },
    { label: "Monthly Revenue",  value: fmt(stats.mrr),                 sub: `${fmt(stats.arr)} ARR`,                icon: DollarSign, lime: true  },
    { label: "Paying Companies", value: stats.byPlan.starter + stats.byPlan.pro, sub: "Starter + Pro plans",         icon: CreditCard, lime: false },
  ];

  const planData = [
    { plan: "Pro",     count: stats.byPlan.pro,     color: "#8b5cf6", price: 99 },
    { plan: "Starter", count: stats.byPlan.starter, color: "#3b82f6", price: 29 },
    { plan: "Free",    count: stats.byPlan.free,     color: "#94a3b8", price: 0  },
  ];
  const total = stats.totalCompanies || 1;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, lime }) => (
          <div key={label}
            className={`rounded-2xl p-5 shadow-sm ${lime ? "" : "bg-white border border-border"}`}
            style={lime ? { background: LIME } : {}}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-xs font-medium ${lime ? "text-black/60" : "text-muted-foreground"}`}>{label}</p>
              <div className={`flex size-8 items-center justify-center rounded-xl ${lime ? "bg-black/15" : "bg-muted"}`}>
                <Icon className={`h-4 w-4 ${lime ? "text-black/70" : "text-muted-foreground"}`} />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-foreground">{value}</p>
            <p className={`text-xs mt-0.5 ${lime ? "text-black/50" : "text-muted-foreground"}`}>{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue by Plan */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-5">Revenue by Plan</h3>
          <div className="space-y-4">
            {planData.map(({ plan, count, color, price }) => (
              <div key={plan}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-full" style={{ background: color }} />
                    <span className="text-xs font-semibold text-foreground">{plan}</span>
                    <span className="text-xs text-muted-foreground">{count} companies</span>
                  </div>
                  <span className="text-xs font-bold">{price > 0 ? fmt(count * price) + "/mo" : "Free"}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(count / total) * 100}%`, background: color }} />
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-3 border-t border-border">
              <span className="text-xs font-semibold text-muted-foreground">Total MRR</span>
              <span className="text-sm font-extrabold">{fmt(stats.mrr)}</span>
            </div>
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-foreground">Recent Registrations</h3>
            <Link href="/super-admin/companies" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {companies.slice(0, 6).map(c => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="size-8 shrink-0 rounded-xl bg-foreground flex items-center justify-center text-white text-[11px] font-bold">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">{c.industry ?? "Unknown"} · {timeAgo(c.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${PLAN_BADGE[c.plan]}`}>{c.plan}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${STATUS_BADGE[c.status] ?? "bg-gray-100 text-gray-500"}`}>{c.status}</span>
                </div>
              </div>
            ))}
            {companies.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">No companies yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Conversion metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Free → Paid Rate",    value: stats.totalCompanies > 0 ? `${Math.round(((stats.byPlan.starter + stats.byPlan.pro) / stats.totalCompanies) * 100)}%` : "0%", desc: "Companies on a paid plan",           icon: TrendingUp },
          { label: "Starter → Pro Rate",  value: (stats.byPlan.starter + stats.byPlan.pro) > 0 ? `${Math.round((stats.byPlan.pro / Math.max(stats.byPlan.starter + stats.byPlan.pro, 1)) * 100)}%` : "0%", desc: "Paid companies on Pro", icon: ArrowUpRight },
          { label: "Avg. Revenue / Co.",  value: stats.activeCompanies > 0 ? fmt(stats.mrr / stats.activeCompanies) : "$0",  desc: "MRR per active company",                icon: BarChart3 },
        ].map(({ label, value, desc, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex size-7 items-center justify-center rounded-lg" style={{ background: LIME + "25" }}>
                <Icon className="h-3.5 w-3.5" style={{ color: "hsl(82 60% 35%)" }} />
              </div>
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
            </div>
            <p className="text-3xl font-extrabold text-foreground">{value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PAGE: COMPANIES
══════════════════════════════════════════════════════ */
function PageCompanies({ companies, onRefresh, token }: { companies: Company[]; onRefresh: () => void; token: string | null }) {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editId, setEditId] = useState<number | null>(null);
  const [editPlan, setEditPlan] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const { save, saving } = useCompanyPatch(token, onRefresh);

  const filtered = companies.filter(c =>
    (planFilter === "all" || c.plan === planFilter) &&
    (statusFilter === "all" || c.status === statusFilter) &&
    (search === "" || c.name.toLowerCase().includes(search.toLowerCase()) || c.industry?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-foreground">Companies</h2>
          <p className="text-xs text-muted-foreground">{companies.length} companies registered on the platform</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-5 py-4 border-b border-border">
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies…"
              className="pl-8 pr-3 py-1.5 border border-border rounded-lg text-xs bg-muted/30 focus:outline-none w-full" />
          </div>
          <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} className="border border-border rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none">
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-border rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{companies.length === 0 ? "No companies yet" : "No matches"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  {["Company", "Plan", "Status", "Members", "Industry", "Registered", "Actions"].map((h, i) => (
                    <th key={h} className={`py-3 px-4 text-xs font-semibold text-muted-foreground ${i === 6 ? "text-right pr-5" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-xl bg-foreground flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-xs">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground">{c.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {editId === c.id ? (
                        <select value={editPlan} onChange={e => setEditPlan(e.target.value)}
                          className="border border-border rounded-lg px-2 py-1 text-xs bg-white focus:outline-none">
                          <option value="">Keep ({c.plan})</option>
                          <option value="free">Free</option>
                          <option value="starter">Starter</option>
                          <option value="pro">Pro</option>
                        </select>
                      ) : (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${PLAN_BADGE[c.plan]}`}>{c.plan}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {editId === c.id ? (
                        <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                          className="border border-border rounded-lg px-2 py-1 text-xs bg-white focus:outline-none">
                          <option value="">Keep ({c.status})</option>
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[c.status] ?? "bg-gray-100 text-gray-500"}`}>
                          {c.status === "active" ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                          {c.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{c.userCount}</span> users ·{" "}
                      <span className="font-medium text-foreground">{c.employeeCount}</span> emp
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">{c.industry ?? "—"}</td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">{timeAgo(c.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {editId === c.id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => setEditId(null)} className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:bg-muted">Cancel</button>
                          <button onClick={() => { save(c.id, { plan: editPlan || undefined, status: editStatus || undefined }); setEditId(null); }}
                            disabled={saving} className="text-xs font-bold px-3 py-1 rounded text-foreground disabled:opacity-60" style={{ background: LIME }}>
                            {saving ? "…" : "Save"}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 justify-end">
                          {c.status === "active" && (
                            <button onClick={() => save(c.id, { status: "suspended" })} title="Suspend"
                              className="flex size-7 items-center justify-center rounded-lg border border-border text-amber-500 hover:bg-amber-50 transition-all">
                              <AlertTriangle className="h-3 w-3" />
                            </button>
                          )}
                          {c.status === "suspended" && (
                            <button onClick={() => save(c.id, { status: "active" })} title="Reactivate"
                              className="flex size-7 items-center justify-center rounded-lg border border-border text-emerald-500 hover:bg-emerald-50 transition-all">
                              <CheckCircle2 className="h-3 w-3" />
                            </button>
                          )}
                          <button onClick={() => { setEditId(c.id); setEditPlan(""); setEditStatus(""); }}
                            className="flex size-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PAGE: SUBSCRIPTIONS
══════════════════════════════════════════════════════ */
function PageSubscriptions({ companies, onRefresh, token }: { companies: Company[]; onRefresh: () => void; token: string | null }) {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [editId, setEditId] = useState<number | null>(null);
  const [editPlan, setEditPlan] = useState("");
  const [editBilling, setEditBilling] = useState("");
  const [editSeats, setEditSeats] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const { save, saving } = useCompanyPatch(token, onRefresh);

  const totalMrr = companies.reduce((sum, c) => {
    if (c.status !== "active") return sum;
    return sum + (c.plan === "pro" ? 99 : c.plan === "starter" ? 29 : 0);
  }, 0);

  const filtered = companies.filter(c =>
    (planFilter === "all" || c.plan === planFilter) &&
    (search === "" || c.name.toLowerCase().includes(search.toLowerCase()))
  );

  const summaryCards = [
    { label: "Total Subscriptions", value: companies.length },
    { label: "Active", value: companies.filter(c => c.status === "active").length, color: "text-emerald-600" },
    { label: "Suspended", value: companies.filter(c => c.status === "suspended").length, color: "text-amber-500" },
    { label: "Total MRR", value: fmt(totalMrr) },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-extrabold text-foreground">Subscriptions</h2>
        <p className="text-xs text-muted-foreground">Manage billing plans, seats and subscription status for all companies</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryCards.map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-border p-4 shadow-sm">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className={`text-2xl font-extrabold text-foreground mt-0.5 ${color ?? ""}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold text-foreground flex-1">Billing Management</h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              className="pl-7 pr-3 py-1.5 border border-border rounded-lg text-xs bg-muted/30 focus:outline-none w-36" />
          </div>
          <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} className="border border-border rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none">
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                {["Company", "Plan", "Billing Cycle", "Seats", "MRR", "Status", "Since", "Actions"].map((h, i) => (
                  <th key={h} className={`py-3 px-4 text-xs font-semibold text-muted-foreground ${i === 7 ? "text-right pr-5" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">No results</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-xl bg-foreground flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-xs">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">{c.userCount} users</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {editId === c.id ? (
                      <select value={editPlan} onChange={e => setEditPlan(e.target.value)}
                        className="border border-border rounded-lg px-2 py-1 text-xs bg-white focus:outline-none">
                        <option value="">Keep ({c.plan})</option>
                        <option value="free">Free — $0</option>
                        <option value="starter">Starter — $29</option>
                        <option value="pro">Pro — $99</option>
                      </select>
                    ) : (
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${PLAN_BADGE[c.plan]}`}>{c.plan}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {editId === c.id ? (
                      <select value={editBilling} onChange={e => setEditBilling(e.target.value)}
                        className="border border-border rounded-lg px-2 py-1 text-xs bg-white focus:outline-none">
                        <option value="">Keep</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    ) : (
                      <span className="text-xs text-muted-foreground capitalize">{c.subscription?.billingCycle ?? "monthly"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {editId === c.id ? (
                      <input type="number" value={editSeats} onChange={e => setEditSeats(e.target.value)}
                        placeholder={String(c.subscription?.seats ?? 5)} className="border border-border rounded-lg px-2 py-1 text-xs bg-white focus:outline-none w-16" />
                    ) : (
                      <span className="text-xs text-foreground">{c.subscription?.seats ?? 5}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-bold text-foreground">
                      {c.plan === "pro" ? "$99" : c.plan === "starter" ? "$29" : "$0"}/mo
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {editId === c.id ? (
                      <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                        className="border border-border rounded-lg px-2 py-1 text-xs bg-white focus:outline-none">
                        <option value="">Keep ({c.status})</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[c.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {c.status === "active" ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                        {c.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">{timeAgo(c.subscription?.startDate ?? c.createdAt)}</td>
                  <td className="px-5 py-3.5 text-right">
                    {editId === c.id ? (
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => setEditId(null)} className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:bg-muted">Cancel</button>
                        <button disabled={saving} onClick={() => {
                          save(c.id, {
                            plan: editPlan || undefined,
                            status: editStatus || undefined,
                            billingCycle: editBilling || undefined,
                            seats: editSeats ? parseInt(editSeats) : undefined,
                          });
                          setEditId(null);
                        }} className="text-xs font-bold px-3 py-1 rounded text-foreground disabled:opacity-60" style={{ background: LIME }}>
                          {saving ? "…" : "Save"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 justify-end">
                        {c.status === "active" && (
                          <button onClick={() => save(c.id, { status: "suspended" })} title="Suspend"
                            className="flex size-7 items-center justify-center rounded-lg border border-border text-amber-500 hover:bg-amber-50 transition-all">
                            <AlertTriangle className="h-3 w-3" />
                          </button>
                        )}
                        {c.status === "suspended" && (
                          <button onClick={() => save(c.id, { status: "active" })} title="Reactivate"
                            className="flex size-7 items-center justify-center rounded-lg border border-border text-emerald-500 hover:bg-emerald-50 transition-all">
                            <CheckCircle2 className="h-3 w-3" />
                          </button>
                        )}
                        <button onClick={() => { setEditId(c.id); setEditPlan(""); setEditBilling(""); setEditSeats(""); setEditStatus(""); }}
                          className="flex size-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PAGE: USERS (derived from companies data)
══════════════════════════════════════════════════════ */
function PageUsers({ companies }: { companies: Company[] }) {
  const [search, setSearch] = useState("");

  const rows = companies.flatMap(c =>
    Array.from({ length: c.userCount }, (_, i) => ({
      companyId: c.id,
      companyName: c.name,
      companyPlan: c.plan,
      id: `${c.id}-${i}`,
      label: i === 0 ? "Admin" : `Member ${i}`,
      count: c.userCount,
    }))
  );

  const companyRows = companies.filter(c =>
    search === "" || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-extrabold text-foreground">Users</h2>
        <p className="text-xs text-muted-foreground">All users across all company tenants on the platform</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Users", value: companies.reduce((s, c) => s + c.userCount, 0) },
          { label: "Total Employees", value: companies.reduce((s, c) => s + c.employeeCount, 0) },
          { label: "Companies", value: companies.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-border p-4 shadow-sm">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold text-foreground flex-1">Users by Company</h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies…"
              className="pl-7 pr-3 py-1.5 border border-border rounded-lg text-xs bg-muted/30 focus:outline-none w-44" />
          </div>
        </div>
        <div className="divide-y divide-border">
          {companyRows.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No companies found</div>
          ) : companyRows.map(c => (
            <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
              <div className="size-10 rounded-xl bg-foreground flex items-center justify-center text-white text-xs font-bold shrink-0">
                {c.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{c.name}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${PLAN_BADGE[c.plan]}`}>{c.plan}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{c.industry ?? "Unknown industry"} · Registered {timeAgo(c.createdAt)}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-lg font-extrabold text-foreground">{c.userCount}</p>
                    <p className="text-[10px] text-muted-foreground">users</p>
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-foreground">{c.employeeCount}</p>
                    <p className="text-[10px] text-muted-foreground">employees</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[c.status] ?? "bg-gray-100 text-gray-500"}`}>{c.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PAGE: SETTINGS
══════════════════════════════════════════════════════ */
function PageSettings() {
  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-lg font-extrabold text-foreground">Platform Settings</h2>
        <p className="text-xs text-muted-foreground">Global configuration for the HRPay platform</p>
      </div>

      {[
        {
          title: "Platform Identity",
          fields: [
            { label: "Platform Name", value: "HRPay", type: "text" },
            { label: "Support Email", value: "support@hrpay.com", type: "email" },
            { label: "Default Timezone", value: "UTC", type: "text" },
          ],
        },
        {
          title: "Plan Pricing",
          fields: [
            { label: "Starter Plan ($/mo)", value: "29", type: "number" },
            { label: "Pro Plan ($/mo)", value: "99", type: "number" },
            { label: "Trial Period (days)", value: "14", type: "number" },
          ],
        },
        {
          title: "Registration",
          fields: [
            { label: "Free Plan Seat Limit", value: "5", type: "number" },
            { label: "Starter Plan Seat Limit", value: "50", type: "number" },
          ],
        },
      ].map(({ title, fields }) => (
        <div key={title} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-4">{title}</h3>
          <div className="space-y-3">
            {fields.map(({ label, value, type }) => (
              <div key={label} className="flex items-center gap-4">
                <label className="text-xs font-medium text-muted-foreground w-44 shrink-0">{label}</label>
                <input type={type} defaultValue={value}
                  className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm bg-muted/30 focus:outline-none focus:ring-1 focus:ring-foreground/20" />
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4 pt-4 border-t border-border">
            <button className="text-xs font-bold px-4 py-1.5 rounded-xl text-foreground" style={{ background: LIME }}>Save Changes</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SUPER ADMIN LAYOUT
══════════════════════════════════════════════════════ */
const NAV = [
  { name: "Overview",      href: "/super-admin",               icon: LayoutDashboard },
  { name: "Companies",     href: "/super-admin/companies",      icon: Building2 },
  { name: "Subscriptions", href: "/super-admin/subscriptions",  icon: CreditCard },
  { name: "Users",         href: "/super-admin/users",          icon: Users },
  { name: "Settings",      href: "/super-admin/settings",       icon: Settings },
];

export default function SuperAdmin({ page = "overview" }: { page?: string }) {
  const { token, logout } = useAuth();
  const [location] = useLocation();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [cRes, sRes] = await Promise.all([
      fetch("/api/companies", { headers: apiHeaders(token) }).then(r => r.json()),
      fetch("/api/companies/stats", { headers: apiHeaders(token) }).then(r => r.json()),
    ]);
    setCompanies(Array.isArray(cRes) ? cRes : []);
    setStats(sRes);
    setLoading(false);
  }

  useEffect(() => { load(); }, [token]);

  const activeNav = NAV.find(n => n.href === location) ?? NAV[0];
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "hsl(220 20% 96%)" }}>
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col bg-white border-r border-border">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 px-4 border-b border-border">
          <div className="flex gap-1">
            <div className="size-3.5 rounded-full" style={{ background: LIME }} />
            <div className="size-3.5 rounded-full bg-foreground" />
          </div>
          <span className="text-sm font-bold text-foreground tracking-tight">HRPay</span>
          <span className="ml-auto text-[9px] font-bold bg-foreground text-white px-1.5 py-0.5 rounded-full uppercase">Admin</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col px-2.5 py-3 gap-0.5 overflow-y-auto">
          {NAV.map(item => {
            const isActive = location === item.href || (item.href !== "/super-admin" && location.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-all",
                  isActive ? "bg-foreground text-white shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}>
                <item.icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-white" : "text-muted-foreground")} />
                {item.name}
              </Link>
            );
          })}

          <div className="flex-1" />

          <a href="/" className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
            <Shield className="h-3.5 w-3.5 shrink-0" />
            View Site
          </a>
          <button onClick={logout}
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all w-full text-left">
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            Logout
          </button>
        </nav>

        {/* Admin badge */}
        <div className="mx-2.5 mb-3 rounded-2xl p-3 text-center" style={{ background: "hsl(220 15% 12%)" }}>
          <Crown className="h-5 w-5 mx-auto mb-1" style={{ color: LIME }} />
          <p className="text-[10px] font-bold text-white">Super Admin</p>
          <p className="text-[9px] text-white/40 mt-0.5">Platform management</p>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white flex flex-col shadow-2xl">
            <div className="flex h-14 shrink-0 items-center justify-between px-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1">
                  <div className="size-3.5 rounded-full" style={{ background: LIME }} />
                  <div className="size-3.5 rounded-full bg-foreground" />
                </div>
                <span className="text-sm font-bold text-foreground tracking-tight">HRPay</span>
                <span className="ml-1 text-[9px] font-bold bg-foreground text-white px-1.5 py-0.5 rounded-full uppercase">Admin</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted">
                <XClose className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col px-2.5 py-3 gap-0.5 overflow-y-auto">
              {NAV.map(item => {
                const isActive = location === item.href || (item.href !== "/super-admin" && location.startsWith(item.href));
                return (
                  <Link key={item.name} href={item.href} onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-all",
                      isActive ? "bg-foreground text-white shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}>
                    <item.icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-white" : "text-muted-foreground")} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between bg-white border-b border-border px-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted">
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-foreground">{activeNav.name}</h1>
              <p className="text-[10px] text-muted-foreground hidden sm:block">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} disabled={loading}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-all disabled:opacity-50">
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className="flex size-8 items-center justify-center rounded-xl bg-foreground text-white text-[11px] font-bold">SA</div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5">
          <div className="max-w-7xl mx-auto">
            {loading && page === "overview" ? (
              <div className="py-20 text-center">
                <div className="size-6 rounded-full animate-spin border-2 border-muted mx-auto mb-3" style={{ borderTopColor: LIME }} />
                <p className="text-sm text-muted-foreground">Loading platform data…</p>
              </div>
            ) : (
              <>
                {page === "overview"       && <PageOverview stats={stats} companies={companies} />}
                {page === "companies"      && <PageCompanies companies={companies} onRefresh={load} token={token} />}
                {page === "subscriptions"  && <PageSubscriptions companies={companies} onRefresh={load} token={token} />}
                {page === "users"          && <PageUsers companies={companies} />}
                {page === "settings"       && <PageSettings />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
