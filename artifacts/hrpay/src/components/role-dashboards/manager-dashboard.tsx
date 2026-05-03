import React from "react";
import { useAuth } from "@/components/auth-context";
import { Link } from "wouter";
import {
  Users, Clock, CalendarDays, Target, AlertCircle,
  CheckCircle2, ArrowRight, TrendingUp, DollarSign,
} from "lucide-react";
import {
  useGetDashboardSummary,
  useGetHeadcountByDepartment,
  useGetLeaveSummary,
} from "@workspace/api-client-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const LIME = "hsl(82 80% 48%)";

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function ActionCard({ icon: Icon, label, value, sub, href, color = "bg-muted" }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; href: string; color?: string;
}) {
  return (
    <Link href={href} className="bg-white rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`flex size-9 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-4 w-4 text-foreground/70" />
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </Link>
  );
}

export default function ManagerDashboard() {
  const { user } = useAuth();
  const summary = useGetDashboardSummary();
  const headcount = useGetHeadcountByDepartment();
  const leaveSummary = useGetLeaveSummary();

  const s = summary.isError ? null : summary.data;
  const hc = headcount.isError ? [] : (headcount.data ?? []);
  const ls = leaveSummary.isError ? [] : (leaveSummary.data ?? []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-foreground">Manager Dashboard</h2>
          <p className="text-sm text-muted-foreground">Welcome back, {user?.name?.split(" ")[0]}. Here's your team overview.</p>
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ActionCard icon={Users} label="Total Employees" value={s?.totalEmployees ?? "—"} sub={`+${s?.newHiresThisMonth ?? 0} new this month`} href="/employees" color="bg-lime-100" />
        <ActionCard icon={CalendarDays} label="Pending Leave" value={s?.pendingLeaveRequests ?? "—"} sub="Awaiting your approval" href="/leave" color="bg-amber-100" />
        <ActionCard icon={Clock} label="Pending Time" value={s?.pendingTimeEntries ?? "—"} sub="Time entries to review" href="/time" color="bg-blue-100" />
        <ActionCard icon={Target} label="Next Payroll" value={s?.nextPayrollDate ?? "—"} sub="Upcoming run" href="/payroll" color="bg-purple-100" />
      </div>

      {/* Headcount chart + pending approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-foreground">Headcount by Department</h3>
              <p className="text-xs text-muted-foreground">Active employees across teams</p>
            </div>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
          {hc.length === 0 ? (
            <div className="flex items-center justify-center h-44 text-sm text-muted-foreground">No department data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hc} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 94%)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(220 10% 55%)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="departmentName" tick={{ fontSize: 10, fill: "hsl(220 10% 55%)" }} width={82} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="fullTime" name="Full-time" stackId="a" fill={LIME} />
                <Bar dataKey="partTime" name="Part-time" stackId="a" fill="#94a3b8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-bold text-foreground mb-4">Pending Actions</h3>
          <div className="space-y-3">
            {[
              { label: "Leave requests", value: s?.pendingLeaveRequests ?? 0, href: "/leave", color: "bg-amber-100 text-amber-700" },
              { label: "Time entries", value: s?.pendingTimeEntries ?? 0, href: "/time", color: "bg-blue-100 text-blue-700" },
            ].map(({ label, value, href, color }) => (
              <Link key={href} href={href} className="flex items-center justify-between p-3.5 rounded-xl border border-border hover:bg-muted/30 transition-all">
                <div className="flex items-center gap-2.5">
                  {value > 0
                    ? <AlertCircle className="h-4 w-4 text-amber-600" />
                    : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${value > 0 ? color : "bg-emerald-100 text-emerald-700"}`}>
                  {value > 0 ? `${value} pending` : "All clear"}
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground mb-3">Leave by Type</p>
            <div className="space-y-2">
              {ls.slice(0, 4).map((l, i) => (
                <div key={l.type} className="flex items-center gap-2 text-xs">
                  <div className="size-2 rounded-full shrink-0" style={{ background: i === 0 ? LIME : i === 1 ? "#1a1a1a" : "#94a3b8" }} />
                  <span className="capitalize text-foreground flex-1">{l.type}</span>
                  <span className="font-semibold text-foreground">{l.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <h3 className="font-bold text-foreground mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { href: "/employees", label: "View All Employees", icon: Users },
            { href: "/leave", label: `Approve ${s?.pendingLeaveRequests ?? 0} Leave Requests`, icon: CalendarDays },
            { href: "/time", label: `Review ${s?.pendingTimeEntries ?? 0} Time Entries`, icon: Clock },
            { href: "/performance", label: "Performance Reviews", icon: Target },
            { href: "/recruitment", label: "Open Positions", icon: DollarSign },
          ].map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-all">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" /> {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
