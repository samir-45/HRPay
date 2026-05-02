import React, { useState, useEffect } from "react";
import { useAuth, apiHeaders } from "@/components/auth-context";
import {
  Building2, Users, DollarSign, TrendingUp, CheckCircle, XCircle,
  Shield, Search, RefreshCw, Crown, CreditCard, BarChart3,
  ArrowUpRight, ArrowDownRight, Calendar, Clock, AlertTriangle,
  CheckCircle2, Ban, MoreHorizontal, Zap, Layers,
} from "lucide-react";

const LIME = "hsl(82 80% 48%)";

interface Company {
  id: number; name: string; slug: string; plan: string; status: string;
  industry?: string; size?: string; createdAt: string;
  userCount: number; employeeCount: number;
  subscription?: {
    id: number; billingCycle: string; seats: number;
    monthlyPrice: string; status: string; startDate: string; endDate?: string;
  };
}

interface Stats {
  totalCompanies: number; activeCompanies: number;
  totalUsers: number; byPlan: { free: number; starter: number; pro: number };
  mrr: number; arr: number;
}

const PLAN_BADGE: Record<string, string> = {
  free: "bg-gray-100 text-gray-600",
  starter: "bg-blue-100 text-blue-700",
  pro: "bg-purple-100 text-purple-700",
};
const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  suspended: "bg-red-100 text-red-600",
  cancelled: "bg-gray-100 text-gray-500",
};

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
function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const TABS = ["Overview", "Subscriptions", "Companies"] as const;
type Tab = typeof TABS[number];

/* ─── Overview Tab ─── */
function OverviewTab({ stats, companies }: { stats: Stats | null; companies: Company[] }) {
  if (!stats) return <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>;

  const planData = [
    { plan: "Pro",     count: stats.byPlan.pro,     color: "#8b5cf6", price: 99 },
    { plan: "Starter", count: stats.byPlan.starter, color: "#3b82f6", price: 29 },
    { plan: "Free",    count: stats.byPlan.free,    color: "#94a3b8", price: 0  },
  ];
  const total = stats.totalCompanies || 1;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Companies",   value: stats.totalCompanies, icon: Building2, sub: `${stats.activeCompanies} active`, accent: false },
          { label: "Platform Users",    value: stats.totalUsers,     icon: Users,     sub: "across all tenants",              accent: false },
          { label: "Monthly Revenue",   value: fmt(stats.mrr),       icon: DollarSign,sub: `${fmt(stats.arr)} ARR`,           accent: true  },
          { label: "Paying Companies",  value: stats.byPlan.starter + stats.byPlan.pro, icon: CreditCard, sub: "Starter + Pro plans", accent: false },
        ].map(({ label, value, icon: Icon, sub, accent }) => (
          <div key={label} className={`rounded-2xl p-5 shadow-sm ${accent ? "" : "bg-white border border-border"}`}
            style={accent ? { background: LIME } : {}}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-xs font-medium ${accent ? "text-foreground/70" : "text-muted-foreground"}`}>{label}</p>
              <div className={`flex size-8 items-center justify-center rounded-xl ${accent ? "bg-black/15" : "bg-muted"}`}>
                <Icon className={`h-4 w-4 ${accent ? "text-foreground" : "text-muted-foreground"}`} />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-foreground">{value}</p>
            <p className={`text-xs mt-0.5 ${accent ? "text-foreground/60" : "text-muted-foreground"}`}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue breakdown + recent signups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-4">Revenue by Plan</h3>
          <div className="space-y-4">
            {planData.map(({ plan, count, color, price }) => (
              <div key={plan}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-full" style={{ background: color }} />
                    <span className="text-xs font-medium text-foreground">{plan}</span>
                    <span className="text-xs text-muted-foreground">{count} companies</span>
                  </div>
                  <span className="text-xs font-bold text-foreground">{price > 0 ? fmt(count * price) + "/mo" : "Free"}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(count / total) * 100}%`, background: color }} />
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-border flex justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total MRR</span>
              <span className="text-sm font-extrabold text-foreground">{fmt(stats.mrr)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="text-sm font-bold text-foreground mb-4">Recent Registrations</h3>
          <div className="space-y-3">
            {companies.slice(0, 5).map(c => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="size-8 shrink-0 rounded-xl bg-foreground flex items-center justify-center text-white text-[11px] font-bold">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">{c.industry ?? "Unknown"} · {timeAgo(c.createdAt)}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${PLAN_BADGE[c.plan]}`}>{c.plan}</span>
              </div>
            ))}
            {companies.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">No companies yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Conversion stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Free → Paid Rate", value: stats.totalCompanies > 0 ? `${Math.round(((stats.byPlan.starter + stats.byPlan.pro) / stats.totalCompanies) * 100)}%` : "0%", icon: TrendingUp, desc: "Companies on a paid plan" },
          { label: "Starter → Pro Rate", value: (stats.byPlan.starter + stats.byPlan.pro) > 0 ? `${Math.round((stats.byPlan.pro / Math.max(stats.byPlan.starter + stats.byPlan.pro, 1)) * 100)}%` : "0%", icon: ArrowUpRight, desc: "Paid companies on Pro" },
          { label: "Avg. Revenue / Co.", value: stats.activeCompanies > 0 ? fmt(stats.mrr / stats.activeCompanies) : "$0", icon: BarChart3, desc: "MRR per active company" },
        ].map(({ label, value, icon: Icon, desc }) => (
          <div key={label} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
            </div>
            <p className="text-2xl font-extrabold text-foreground">{value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Subscriptions Tab ─── */
function SubscriptionsTab({ companies, onUpdate, token }: {
  companies: Company[]; onUpdate: () => void; token: string | null;
}) {
  const [editId, setEditId] = useState<number | null>(null);
  const [editPlan, setEditPlan] = useState("");
  const [editBilling, setEditBilling] = useState("");
  const [editSeats, setEditSeats] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");

  const filtered = companies.filter(c =>
    (planFilter === "all" || c.plan === planFilter) &&
    (statusFilter === "all" || c.status === statusFilter) &&
    (search === "" || c.name.toLowerCase().includes(search.toLowerCase()))
  );

  const totalMrr = companies.reduce((sum, c) => {
    const price = parseFloat(c.subscription?.monthlyPrice ?? "0");
    return sum + price;
  }, 0);

  async function save(id: number) {
    setSaving(true);
    await fetch(`/api/companies/${id}`, {
      method: "PATCH",
      headers: apiHeaders(token),
      body: JSON.stringify({
        plan: editPlan || undefined,
        status: editStatus || undefined,
        billingCycle: editBilling || undefined,
        seats: editSeats ? parseInt(editSeats) : undefined,
      }),
    });
    await onUpdate();
    setEditId(null);
    setSaving(false);
  }

  async function quickAction(id: number, action: string) {
    const body: any = {};
    if (action === "suspend") body.status = "suspended";
    if (action === "activate") body.status = "active";
    if (action === "cancel") body.status = "cancelled";
    await fetch(`/api/companies/${id}`, {
      method: "PATCH",
      headers: apiHeaders(token),
      body: JSON.stringify(body),
    });
    onUpdate();
  }

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Subscriptions", value: companies.length },
          { label: "Active", value: companies.filter(c => c.status === "active").length, color: "text-emerald-600" },
          { label: "Suspended", value: companies.filter(c => c.status === "suspended").length, color: "text-red-500" },
          { label: "Total MRR", value: fmt(totalMrr), color: "font-bold" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-border p-4 shadow-sm">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className={`text-xl font-extrabold text-foreground mt-0.5 ${color ?? ""}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold text-foreground flex-1">Subscription Management</h3>
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
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-border rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Billing</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Seats</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">MRR</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Start Date</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">No subscriptions found</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-muted/10">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-xl bg-foreground flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-xs">{c.name}</p>
                        <p className="text-[11px] text-muted-foreground">{c.userCount} users</p>
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
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${PLAN_BADGE[c.plan]}`}>{c.plan}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {editId === c.id ? (
                      <select value={editBilling} onChange={e => setEditBilling(e.target.value)}
                        className="border border-border rounded-lg px-2 py-1 text-xs bg-white focus:outline-none">
                        <option value="">Keep ({c.subscription?.billingCycle ?? "monthly"})</option>
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
                        placeholder={String(c.subscription?.seats ?? 5)}
                        className="border border-border rounded-lg px-2 py-1 text-xs bg-white focus:outline-none w-16" />
                    ) : (
                      <span className="text-xs text-foreground">{c.subscription?.seats ?? 5}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-semibold text-foreground">
                      {c.plan === "free" ? "$0" : c.plan === "starter" ? "$29" : "$99"}/mo
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
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS_BADGE[c.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {c.status === "active" ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                        {c.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">
                    {fmtDate(c.subscription?.startDate ?? c.createdAt)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {editId === c.id ? (
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => setEditId(null)} className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:bg-muted">Cancel</button>
                        <button onClick={() => save(c.id)} disabled={saving}
                          className="text-xs font-bold px-3 py-1 rounded text-foreground disabled:opacity-60"
                          style={{ background: LIME }}>{saving ? "…" : "Save"}</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 justify-end">
                        {c.status === "active" && (
                          <button onClick={() => quickAction(c.id, "suspend")}
                            className="text-[11px] px-2 py-1 rounded border border-border text-amber-600 hover:bg-amber-50 transition-all"
                            title="Suspend">
                            <AlertTriangle className="h-3 w-3" />
                          </button>
                        )}
                        {c.status === "suspended" && (
                          <button onClick={() => quickAction(c.id, "activate")}
                            className="text-[11px] px-2 py-1 rounded border border-border text-emerald-600 hover:bg-emerald-50 transition-all"
                            title="Reactivate">
                            <CheckCircle2 className="h-3 w-3" />
                          </button>
                        )}
                        <button onClick={() => { setEditId(c.id); setEditPlan(""); setEditBilling(""); setEditSeats(""); setEditStatus(""); }}
                          className="text-[11px] px-2.5 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                          Edit
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

/* ─── Companies Tab ─── */
function CompaniesTab({ companies, onUpdate, token }: {
  companies: Company[]; onUpdate: () => void; token: string | null;
}) {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [editId, setEditId] = useState<number | null>(null);
  const [editPlan, setEditPlan] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = companies.filter(c =>
    (planFilter === "all" || c.plan === planFilter) &&
    (search === "" || c.name.toLowerCase().includes(search.toLowerCase()) || c.industry?.toLowerCase().includes(search.toLowerCase()))
  );

  async function saveEdit(id: number) {
    setSaving(true);
    await fetch(`/api/companies/${id}`, {
      method: "PATCH",
      headers: apiHeaders(token),
      body: JSON.stringify({ plan: editPlan || undefined, status: editStatus || undefined }),
    });
    await onUpdate();
    setEditId(null);
    setSaving(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="text-sm font-bold text-foreground">All Companies</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies…"
              className="pl-8 pr-3 py-1.5 border border-border rounded-lg text-xs bg-muted/30 focus:outline-none w-44" />
          </div>
          <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} className="border border-border rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none">
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          <Building2 className="h-8 w-8 mx-auto mb-3 opacity-30" />
          {companies.length === 0 ? "No companies registered yet" : "No companies match your filters"}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Members</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Registered</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-muted/20">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-xl bg-foreground flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.industry ?? "—"} · {c.size ?? "?"} employees</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {editId === c.id ? (
                      <select value={editPlan} onChange={e => setEditPlan(e.target.value)} className="border border-border rounded-lg px-2 py-1 text-xs bg-white focus:outline-none">
                        <option value="">Keep current</option>
                        <option value="free">Free</option>
                        <option value="starter">Starter</option>
                        <option value="pro">Pro</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${PLAN_BADGE[c.plan] ?? "bg-gray-100 text-gray-600"}`}>{c.plan}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {editId === c.id ? (
                      <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="border border-border rounded-lg px-2 py-1 text-xs bg-white focus:outline-none">
                        <option value="">Keep current</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[c.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {c.status === "active" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {c.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span className="font-medium text-foreground">{c.userCount}</span> users ·
                      <span className="font-medium text-foreground">{c.employeeCount}</span> emp
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">{timeAgo(c.createdAt)}</td>
                  <td className="px-5 py-3.5 text-right">
                    {editId === c.id ? (
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => setEditId(null)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-border hover:bg-muted">Cancel</button>
                        <button onClick={() => saveEdit(c.id)} disabled={saving} className="text-xs font-semibold px-3 py-1 rounded text-foreground disabled:opacity-60" style={{ background: LIME }}>
                          {saving ? "…" : "Save"}
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditId(c.id); setEditPlan(""); setEditStatus(""); }}
                        className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-all">
                        Manage
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Main Super Admin ─── */
export default function SuperAdmin() {
  const { token } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  async function load() {
    setLoading(true);
    const [companiesRes, statsRes] = await Promise.all([
      fetch("/api/companies", { headers: apiHeaders(token) }).then(r => r.json()),
      fetch("/api/companies/stats", { headers: apiHeaders(token) }).then(r => r.json()),
    ]);
    setCompanies(Array.isArray(companiesRes) ? companiesRes : []);
    setStats(statsRes);
    setLoading(false);
  }

  useEffect(() => { load(); }, [token]);

  return (
    <div className="min-h-screen" style={{ background: "hsl(220 20% 96%)" }}>
      {/* Header */}
      <header className="bg-white border-b border-border px-6 py-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <div className="size-4 rounded-full" style={{ background: LIME }} />
                <div className="size-4 rounded-full bg-foreground" />
              </div>
              <div>
                <span className="font-bold text-foreground">HRPay</span>
                <span className="ml-2 text-xs bg-foreground text-white px-2 py-0.5 rounded-full font-medium">Super Admin</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={load} disabled={loading}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-all disabled:opacity-50">
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
              </button>
              <Crown className="h-5 w-5" style={{ color: LIME }} />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 pb-0">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${activeTab === tab ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {tab === "Overview" && <BarChart3 className="h-3.5 w-3.5" />}
                {tab === "Subscriptions" && <CreditCard className="h-3.5 w-3.5" />}
                {tab === "Companies" && <Building2 className="h-3.5 w-3.5" />}
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {loading && activeTab === "Overview" ? (
          <div className="py-20 text-center text-sm text-muted-foreground">
            <div className="size-6 rounded-full animate-spin border-2 border-muted mx-auto mb-3" style={{ borderTopColor: LIME }} />
            Loading platform data…
          </div>
        ) : (
          <>
            {activeTab === "Overview" && <OverviewTab stats={stats} companies={companies} />}
            {activeTab === "Subscriptions" && <SubscriptionsTab companies={companies} onUpdate={load} token={token} />}
            {activeTab === "Companies" && <CompaniesTab companies={companies} onUpdate={load} token={token} />}
          </>
        )}
      </main>
    </div>
  );
}
