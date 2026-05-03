import React from "react";
import { useAuth } from "@/components/auth-context";
import { Link } from "wouter";
import {
  Users, DollarSign, TrendingUp, CalendarDays, Clock,
  Building2, BarChart3, ArrowRight, CheckCircle2,
} from "lucide-react";
import {
  useGetDashboardSummary,
  useGetHeadcountByDepartment,
  useGetPayrollTrends,
  useGetLeaveSummary,
} from "@workspace/api-client-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const LIME = "hsl(82 80% 48%)";
const GRAY = "hsl(220 15% 80%)";

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function KPI({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 shadow-sm ${accent ? "" : "bg-white border border-border"}`}
      style={accent ? { background: LIME } : {}}>
      <p className={`text-xs font-medium mb-1 ${accent ? "text-foreground/70" : "text-muted-foreground"}`}>{label}</p>
      <p className={`text-2xl font-extrabold ${accent ? "text-foreground" : "text-foreground"}`}>{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${accent ? "text-foreground/60" : "text-muted-foreground"}`}>{sub}</p>}
    </div>
  );
}

export default function CeooDashboard() {
  const { user } = useAuth();
  const summary = useGetDashboardSummary();
  const headcount = useGetHeadcountByDepartment();
  const trends = useGetPayrollTrends({ months: 6 });
  const leaveSummary = useGetLeaveSummary();

  const s = summary.isError ? null : summary.data;
  const hc = headcount.isError ? [] : (headcount.data ?? []);
  const tr = trends.isError ? [] : (trends.data ?? []);
  const ls = leaveSummary.isError ? [] : (leaveSummary.data ?? []);
  const totalEmployees = hc.reduce((a, d) => a + (d.fullTime ?? 0) + (d.partTime ?? 0) + (d.contractors ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="rounded-2xl p-6 bg-foreground text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm">Executive Overview</p>
            <h2 className="text-2xl font-extrabold mt-0.5">Good {new Date().getHours() < 12 ? "morning" : "afternoon"}, {user?.name?.split(" ")[0]}</h2>
          </div>
          <div className="text-right">
            <p className="text-white/50 text-xs">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
            <p className="text-white font-semibold text-sm mt-0.5">CEOO Dashboard</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-6 pt-5 border-t border-white/10">
          {[
            { label: "Total Headcount", value: s?.totalEmployees ?? "—" },
            { label: "Payroll YTD", value: fmt(s?.totalPayrollYTD) },
            { label: "New Hires (Month)", value: s?.newHiresThisMonth ?? 0 },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-white/50 text-xs">{label}</p>
              <p className="text-xl font-bold text-white mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Active Employees" value={s?.totalEmployees ?? "—"} sub="Across all departments" accent />
        <KPI label="Pending Approvals" value={(s?.pendingLeaveRequests ?? 0) + (s?.pendingTimeEntries ?? 0)} sub="Leave + time combined" />
        <KPI label="Departments" value={hc.length} sub="Active teams" />
        <KPI label="Next Payroll" value={s?.nextPayrollDate ?? "—"} sub="Scheduled run" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Payroll trend */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-foreground">Payroll Trend</h3>
              <p className="text-xs text-muted-foreground">Net pay over 6 months</p>
            </div>
            <Link href="/payroll" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">Details <ArrowRight className="h-3 w-3" /></Link>
          </div>
          {tr.length === 0 ? (
            <div className="flex items-center justify-center h-44 text-sm text-muted-foreground">No payroll data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={tr} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="limeGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={LIME} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={LIME} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 94%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(220 10% 55%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(220 10% 55%)" }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="totalNet" name="Net Pay" stroke={LIME} strokeWidth={2.5} fill="url(#limeGrad2)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Headcount by dept */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-foreground">Headcount by Department</h3>
              <p className="text-xs text-muted-foreground">Full-time + part-time</p>
            </div>
            <Link href="/departments" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">Details <ArrowRight className="h-3 w-3" /></Link>
          </div>
          {hc.length === 0 ? (
            <div className="flex items-center justify-center h-44 text-sm text-muted-foreground">No department data</div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={hc} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 94%)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(220 10% 55%)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="departmentName" tick={{ fontSize: 10, fill: "hsl(220 10% 55%)" }} width={82} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="fullTime" name="Full-time" stackId="a" fill={LIME} />
                <Bar dataKey="partTime" name="Part-time" stackId="a" fill={GRAY} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <h3 className="font-bold text-foreground mb-4">Executive Links</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/reports", icon: BarChart3, label: "Reports" },
            { href: "/performance", icon: TrendingUp, label: "Performance" },
            { href: "/payroll", icon: DollarSign, label: "Payroll" },
            { href: "/recruitment", icon: Users, label: "Recruitment" },
          ].map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/40 hover:bg-muted transition-all text-center">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
