import React, { useState, useEffect } from "react";
import { useAuth, apiHeaders } from "@/components/auth-context";
import {
  Building2, Users, DollarSign, TrendingUp, CheckCircle, XCircle,
  Shield, MoreHorizontal, Search, RefreshCw, ExternalLink, Crown,
} from "lucide-react";

const LIME = "hsl(82 80% 48%)";

interface Company {
  id: number; name: string; slug: string; plan: string; status: string;
  industry?: string; size?: string; createdAt: string;
  userCount: number; employeeCount: number;
  subscription?: { billingCycle: string; seats: number; monthlyPrice: string };
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

export default function SuperAdmin() {
  const { token } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPlan, setEditPlan] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [saving, setSaving] = useState(false);

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

  async function saveEdit(id: number) {
    setSaving(true);
    await fetch(`/api/companies/${id}`, {
      method: "PATCH",
      headers: apiHeaders(token),
      body: JSON.stringify({ plan: editPlan || undefined, status: editStatus || undefined }),
    });
    await load();
    setEditingId(null);
    setSaving(false);
  }

  const filtered = companies.filter(c =>
    (planFilter === "all" || c.plan === planFilter) &&
    (search === "" || c.name.toLowerCase().includes(search.toLowerCase()) || c.industry?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen" style={{ background: "hsl(220 20% 96%)" }}>
      {/* Header */}
      <header className="bg-white border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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
            <button onClick={load} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-all">
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
            <Crown className="h-5 w-5" style={{ color: LIME }} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Platform Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all companies and subscriptions on HRPay</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Companies", value: stats.totalCompanies, icon: Building2, sub: `${stats.activeCompanies} active` },
              { label: "Total Users", value: stats.totalUsers, icon: Users, sub: "across all companies" },
              { label: "Monthly Revenue", value: fmt(stats.mrr), icon: DollarSign, sub: `${fmt(stats.arr)} ARR` },
              { label: "Plan Breakdown", value: `${stats.byPlan.pro}P / ${stats.byPlan.starter}S / ${stats.byPlan.free}F`, icon: TrendingUp, sub: "Pro · Starter · Free" },
            ].map(({ label, value, icon: Icon, sub }) => (
              <div key={label} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground font-medium">{label}</p>
                  <div className="flex size-8 items-center justify-center rounded-xl" style={{ background: LIME + "25" }}>
                    <Icon className="h-4 w-4" style={{ color: "hsl(82 60% 35%)" }} />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Plan distribution */}
        {stats && (
          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-4">Plan Distribution</h3>
            <div className="space-y-3">
              {[
                { plan: "Pro", count: stats.byPlan.pro, color: "#8b5cf6", price: 99 },
                { plan: "Starter", count: stats.byPlan.starter, color: "#3b82f6", price: 29 },
                { plan: "Free", count: stats.byPlan.free, color: "#94a3b8", price: 0 },
              ].map(({ plan, count, color, price }) => {
                const total = stats.totalCompanies || 1;
                return (
                  <div key={plan} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-muted-foreground w-14">{plan}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(count / total) * 100}%`, background: color }} />
                    </div>
                    <span className="text-xs font-semibold text-foreground w-6 text-right">{count}</span>
                    {price > 0 && <span className="text-xs text-muted-foreground w-20 text-right">${(count * price).toLocaleString()}/mo</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Companies Table */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">All Companies</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies…"
                  className="pl-8 pr-3 py-1.5 border border-border rounded-lg text-xs bg-muted/30 focus:outline-none focus:ring-1 w-44" />
              </div>
              <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} className="border border-border rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none">
                <option value="all">All Plans</option>
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Loading companies…</div>
          ) : filtered.length === 0 ? (
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
                        {editingId === c.id ? (
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
                        {editingId === c.id ? (
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
                        {editingId === c.id ? (
                          <div className="flex items-center gap-2 justify-end">
                            <button onClick={() => setEditingId(null)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-border hover:bg-muted">Cancel</button>
                            <button onClick={() => saveEdit(c.id)} disabled={saving} className="text-xs font-semibold px-3 py-1 rounded text-foreground disabled:opacity-60" style={{ background: LIME }}>
                              {saving ? "…" : "Save"}
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingId(c.id); setEditPlan(""); setEditStatus(""); }}
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
      </main>
    </div>
  );
}
