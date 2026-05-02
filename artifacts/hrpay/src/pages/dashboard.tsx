import React from "react";
import {
  useGetDashboardSummary,
  useGetHeadcountByDepartment,
  useGetPayrollTrends,
  useGetLeaveSummary,
  useGetUpcomingEvents,
} from "@workspace/api-client-react";
import {
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Link } from "wouter";
import { Users, DollarSign, Clock, CalendarDays, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

const LIME = "hsl(82 80% 48%)";
const LIME_DARK = "hsl(82 80% 38%)";
const GRAY_CHART = "hsl(220 15% 80%)";

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

/* Tiny sparkline for KPI cards — fixed size, no ResponsiveContainer */
function Sparkline({ data, color = LIME }: { data: number[]; color?: string }) {
  const points = data.map((v) => ({ v }));
  return (
    <LineChart width={80} height={36} data={points} margin={{ top: 4, right: 2, bottom: 4, left: 2 }}>
      <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
    </LineChart>
  );
}

/* KPI card — first one gets lime green hero style */
function KpiCard({
  label, value, sub, change, sparkData, hero = false,
}: {
  label: string; value: string | number; sub?: string;
  change?: string; sparkData?: number[]; hero?: boolean;
}) {
  const bg = hero ? LIME : "white";
  const textColor = hero ? "text-foreground" : "text-foreground";
  const mutedColor = hero ? "text-foreground/70" : "text-muted-foreground";
  const changeBg = hero ? "bg-black/15 text-foreground" : "bg-muted text-muted-foreground";

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 shadow-sm"
      style={{ background: bg, border: hero ? "none" : "1px solid hsl(220 15% 91%)" }}
    >
      <div className="flex items-center justify-between">
        <div className={`flex size-9 items-center justify-center rounded-xl ${hero ? "bg-black/15" : "bg-muted"}`}>
          <CalendarDays className={`h-4 w-4 ${hero ? "text-foreground" : "text-muted-foreground"}`} />
        </div>
        {change && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${changeBg}`}>{change}</span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className={`text-xs font-medium ${mutedColor}`}>{label}</p>
          <p className={`text-2xl font-bold tracking-tight mt-0.5 ${textColor}`}>{value}</p>
          {sub && <p className={`text-xs mt-0.5 ${mutedColor}`}>{sub}</p>}
        </div>
        {sparkData && (
          <div className="shrink-0 opacity-80">
            <Sparkline data={sparkData} color={hero ? "hsl(220 15% 10%)" : LIME} />
          </div>
        )}
      </div>
    </div>
  );
}

const PIE_COLORS = [LIME, "#1a1a1a", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0"];

/* Custom donut label */
function DonutLabel({ cx, cy, total }: { cx: number; cy: number; total: number }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="fill-foreground">
      <tspan x={cx} dy="-0.3em" style={{ fontSize: 18, fontWeight: 700 }}>{total}</tspan>
      <tspan x={cx} dy="1.4em" style={{ fontSize: 11, fill: "hsl(220 10% 55%)" }}>requests</tspan>
    </text>
  );
}

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

  const totalLeave = ls.reduce((a, l) => a + l.count, 0);

  /* Fake sparkline data until real time-series per KPI is available */
  const empSpark = [18, 18, 19, 19, 19, 20, 20];
  const paySpark = tr.slice(-7).map((t) => t.totalGross / 1000);
  const leaveSpark = [1, 3, 2, 4, 3, 5, s?.pendingLeaveRequests ?? 3];
  const timeSpark  = [2, 1, 3, 2, 4, 3, s?.pendingTimeEntries ?? 3];

  return (
    <div className="space-y-5">

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          hero
          label="Total Employees"
          value={s?.totalEmployees ?? "—"}
          sub={`+${s?.newHiresThisMonth ?? 0} this month`}
          change="+1.23%"
          sparkData={empSpark}
        />
        <KpiCard
          label="Payroll YTD"
          value={fmt(s?.totalPayrollYTD)}
          sub="Gross disbursed"
          change="+0.54%"
          sparkData={paySpark.length ? paySpark : [3, 4, 3.5, 5, 4, 5.5, 6]}
        />
        <KpiCard
          label="Pending Leave"
          value={s?.pendingLeaveRequests ?? "—"}
          sub="Awaiting approval"
          change="+1.89%"
          sparkData={leaveSpark}
        />
        <KpiCard
          label="Pending Time"
          value={s?.pendingTimeEntries ?? "—"}
          sub="Entries to review"
          change="-4.56%"
          sparkData={timeSpark}
        />
      </div>

      {/* Row 2: Payroll trend + Leave donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Payroll vs Target bar chart (2/3 width) */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-border p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-foreground">Payroll vs Prior Period</h3>
              <p className="text-xs text-muted-foreground">Gross pay comparison by period</p>
            </div>
            <TrendingUp className="h-5 w-5 text-muted-foreground mt-0.5" />
          </div>
          {tr.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No completed payroll runs yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tr} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 94%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number) => fmt(v)}
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(220 15% 91%)", fontSize: 12 }}
                />
                <Bar dataKey="totalGross" name="Gross" fill={LIME} radius={[6, 6, 0, 0]} />
                <Bar dataKey="totalNet" name="Net" fill={GRAY_CHART} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Leave by type donut (1/3 width) */}
        <div className="rounded-2xl bg-white border border-border p-5 shadow-sm">
          <h3 className="font-bold text-foreground">Leave by Type</h3>
          <p className="text-xs text-muted-foreground mb-2">All-time requests</p>
          {ls.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No leave data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={ls}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={76}
                    paddingAngle={2}
                  >
                    {ls.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-1">
                {ls.map((l, i) => (
                  <div key={l.type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="size-2.5 rounded-sm shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="capitalize truncate">{l.type}</span>
                    <span className="ml-auto font-semibold text-foreground">{l.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row 3: Headcount bar + Sales Growth style area chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Headcount */}
        <div className="rounded-2xl bg-white border border-border p-5 shadow-sm">
          <h3 className="font-bold text-foreground mb-0.5">Headcount by Department</h3>
          <p className="text-xs text-muted-foreground mb-4">Active employees</p>
          {hc.length === 0 ? (
            <div className="flex items-center justify-center h-44 text-muted-foreground text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hc} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 94%)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(220 10% 55%)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="departmentName" tick={{ fontSize: 10, fill: "hsl(220 10% 55%)" }} width={82} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="fullTime" name="Full-time" stackId="a" fill={LIME} />
                <Bar dataKey="partTime" name="Part-time" stackId="a" fill={GRAY_CHART} />
                <Bar dataKey="contractors" name="Contractors" stackId="a" fill="#1a1a1a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payroll growth area chart */}
        <div className="rounded-2xl bg-white border border-border p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-foreground">Payroll Growth</h3>
              <p className="text-xs text-muted-foreground">Net pay over time</p>
            </div>
            <div className="flex gap-1 bg-muted rounded-xl p-1 text-xs">
              {["1M", "3M", "6M", "1Y"].map((l, i) => (
                <button key={l} className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${i === 2 ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  style={i === 2 ? { background: LIME } : {}}>{l}</button>
              ))}
            </div>
          </div>
          {tr.length === 0 ? (
            <div className="flex items-center justify-center h-44 text-muted-foreground text-sm">No completed payroll runs yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={tr} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="limeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={LIME} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={LIME} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 94%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number) => fmt(v)}
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(220 15% 91%)", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="totalNet" name="Net Pay" stroke={LIME} strokeWidth={2.5} fill="url(#limeGrad)" dot={false} activeDot={{ r: 5, fill: LIME, stroke: "white", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick Action chips */}
      <div className="flex gap-3 flex-wrap">
        <Link href="/leave" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-sm" style={{ background: LIME, color: "hsl(220 15% 10%)" }}>
          <AlertCircle className="h-4 w-4" />
          {s?.pendingLeaveRequests ?? 0} pending leave requests
        </Link>
        <Link href="/time" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-white text-sm font-semibold hover:bg-foreground/90 transition-all">
          <Clock className="h-4 w-4" />
          {s?.pendingTimeEntries ?? 0} time entries to approve
        </Link>
        <Link href="/payroll" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors">
          <CheckCircle2 className="h-4 w-4" style={{ color: LIME }} />
          Next payroll: {s?.nextPayrollDate ?? "—"}
        </Link>
      </div>
    </div>
  );
}
