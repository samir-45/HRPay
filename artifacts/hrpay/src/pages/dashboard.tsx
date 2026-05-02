import React from "react";
import {
  useGetDashboardSummary,
  useGetHeadcountByDepartment,
  useGetPayrollTrends,
  useGetLeaveSummary,
  useGetUpcomingEvents,
} from "@workspace/api-client-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Link } from "wouter";
import { Users, DollarSign, Clock, CalendarDays, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function StatCard({ label, value, sub, icon: Icon, accent }: { label: string; value: string | number; sub?: string; icon: React.ElementType; accent?: string }) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 flex items-start gap-4">
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${accent || "bg-primary/10"}`}>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground truncate">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const CHART_COLORS = ["#0d6efd", "#20c997", "#6f42c1", "#fd7e14", "#dc3545", "#0dcaf0", "#ffc107"];

export default function Dashboard() {
  const summary = useGetDashboardSummary();
  const headcount = useGetHeadcountByDepartment();
  const trends = useGetPayrollTrends({ months: 6 });
  const leaveSummary = useGetLeaveSummary();
  const events = useGetUpcomingEvents();

  const s = summary.data;
  const hc = headcount.data ?? [];
  const tr = trends.data ?? [];
  const ls = leaveSummary.data ?? [];
  const ev = events.data ?? [];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={s?.totalEmployees ?? "—"} sub={`${s?.newHiresThisMonth ?? 0} new this month`} icon={Users} />
        <StatCard label="Payroll YTD" value={fmt(s?.totalPayrollYTD)} sub="Gross disbursed" icon={DollarSign} />
        <StatCard label="Pending Leave" value={s?.pendingLeaveRequests ?? "—"} sub="Awaiting approval" icon={CalendarDays} accent="bg-amber-50" />
        <StatCard label="Pending Time" value={s?.pendingTimeEntries ?? "—"} sub="Entries to review" icon={Clock} accent="bg-orange-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payroll Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Payroll Trend</h3>
              <p className="text-xs text-muted-foreground">Gross vs net pay — last 6 payroll periods</p>
            </div>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
          {tr.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No completed payroll runs yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={tr} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Line type="monotone" dataKey="totalGross" name="Gross" stroke="#0369a1" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="totalNet" name="Net" stroke="#20c997" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Leave Summary Pie */}
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">Leave by Type</h3>
            <p className="text-xs text-muted-foreground">All-time requests</p>
          </div>
          {ls.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No leave data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={ls} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={72} label={({ type }) => type}>
                  {ls.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Headcount by Department */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-1">Headcount by Department</h3>
          <p className="text-xs text-muted-foreground mb-4">Active employees</p>
          {hc.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hc} layout="vertical" margin={{ left: 10, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="departmentName" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="fullTime" name="Full-time" stackId="a" fill="#0369a1" />
                <Bar dataKey="partTime" name="Part-time" stackId="a" fill="#7dd3fc" />
                <Bar dataKey="contractors" name="Contractors" stackId="a" fill="#0d9488" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Upcoming Events</h3>
            <span className="text-xs text-muted-foreground">Next 30 days</span>
          </div>
          {ev.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No upcoming events</div>
          ) : (
            <div className="space-y-3">
              {ev.slice(0, 6).map((event) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium
                    ${event.type === "payroll" ? "bg-emerald-100 text-emerald-700" :
                      event.type === "leave_start" ? "bg-amber-100 text-amber-700" :
                      "bg-violet-100 text-violet-700"}`}>
                    {event.type === "payroll" ? "$" : event.type === "leave_start" ? "L" : "★"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        <Link href="/leave" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 text-amber-800 text-sm font-medium border border-amber-200 hover:bg-amber-100 transition-colors">
          <AlertCircle className="h-4 w-4" />
          {s?.pendingLeaveRequests ?? 0} pending leave requests
        </Link>
        <Link href="/time" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-50 text-orange-800 text-sm font-medium border border-orange-200 hover:bg-orange-100 transition-colors">
          <Clock className="h-4 w-4" />
          {s?.pendingTimeEntries ?? 0} time entries to approve
        </Link>
        <Link href="/payroll" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-800 text-sm font-medium border border-emerald-200 hover:bg-emerald-100 transition-colors">
          <CheckCircle2 className="h-4 w-4" />
          Next payroll: {s?.nextPayrollDate ?? "—"}
        </Link>
      </div>
    </div>
  );
}
