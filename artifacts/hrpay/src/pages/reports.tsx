import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth, apiHeaders } from "@/components/auth-context";
import { FileText, Download, Users, DollarSign, CalendarDays, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const API = "/api";
const LIME = "hsl(82 80% 48%)";
const GRAY = "hsl(220 15% 80%)";

function fmt(n: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n); }

interface HeadcountData { total: number; byStatus: Record<string, number>; byType: Record<string, number>; byDepartment: Record<string, number>; employees: { id: number; firstName: string; lastName: string; email: string; position: string; departmentName?: string; employmentType: string; status: string; startDate: string; salary?: string }[] }
interface PayrollData { runs: { id: number; periodStart: string; periodEnd: string; totalGross?: string; totalNet?: string; totalTax?: string; status: string }[]; totals: { totalGross: number; totalNet: number; totalTax: number } }
interface LeaveData { requests: { id: number; firstName?: string; lastName?: string; departmentName?: string; type: string; startDate: string; days?: string; status: string }[]; byType: Record<string, number>; byStatus: Record<string, number>; total: number }
interface AttendanceData { entries: { id: number; firstName?: string; lastName?: string; date: string; hoursWorked?: string; status: string; type?: string }[]; totalHours: number; byStatus: Record<string, number>; total: number }

const PIE_COLORS = [LIME, "#1a1a1a", "#64748b", "#94a3b8", "#cbd5e1"];

function Section({ title, subtitle, icon: Icon, children }: { title: string; subtitle: string; icon: React.ElementType; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl" style={{ background: LIME }}>
            <Icon className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-left">
            <p className="font-bold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-border">{children}</div>}
    </div>
  );
}

export default function Reports() {
  const { token } = useAuth();
  const headcount = useQuery<HeadcountData>({ queryKey: ["report-headcount"], queryFn: () => fetch(`${API}/reports/headcount`, { headers: apiHeaders(token) }).then(r => r.json()) });
  const payroll = useQuery<PayrollData>({ queryKey: ["report-payroll"], queryFn: () => fetch(`${API}/reports/payroll-summary`, { headers: apiHeaders(token) }).then(r => r.json()) });
  const leave = useQuery<LeaveData>({ queryKey: ["report-leave"], queryFn: () => fetch(`${API}/reports/leave`, { headers: apiHeaders(token) }).then(r => r.json()) });
  const attendance = useQuery<AttendanceData>({ queryKey: ["report-attendance"], queryFn: () => fetch(`${API}/reports/attendance`, { headers: apiHeaders(token) }).then(r => r.json()) });

  const hc = headcount.data;
  const pr = payroll.data;
  const lv = leave.data;
  const at = attendance.data;

  const deptData = hc ? Object.entries(hc.byDepartment).map(([name, count]) => ({ name: name.length > 12 ? name.slice(0, 12) + "…" : name, count })) : [];
  const leaveTypeData = lv ? Object.entries(lv.byType).map(([type, days]) => ({ type, days })) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Reports & Analytics</h2>
          <p className="text-sm text-muted-foreground">Pre-built reports across all HR modules</p>
        </div>
        <button
          onClick={() => {
            const rows: string[][] = [];
            const addSection = (title: string, headers: string[], data: string[][]) => {
              rows.push([title], headers, ...data, []);
            };
            if (hc) {
              addSection("HEADCOUNT", ["Name", "Position", "Department", "Type", "Status", "Start Date", "Salary"],
                hc.employees.map(e => [
                  `${e.firstName} ${e.lastName}`, e.position, e.departmentName ?? "", e.employmentType, e.status,
                  new Date(e.startDate).toLocaleDateString(), e.salary ? String(Number(e.salary)) : "",
                ]));
            }
            if (pr) {
              addSection("PAYROLL RUNS", ["Period Start", "Period End", "Gross", "Net", "Tax", "Status"],
                pr.runs.map(r => [r.periodStart, r.periodEnd, r.totalGross ?? "", r.totalNet ?? "", r.totalTax ?? "", r.status]));
            }
            if (lv) {
              addSection("LEAVE REQUESTS", ["Employee", "Department", "Type", "Start Date", "Days", "Status"],
                lv.requests.map(r => [`${r.firstName ?? ""} ${r.lastName ?? ""}`.trim(), r.departmentName ?? "", r.type, r.startDate, String(r.days ?? ""), r.status]));
            }
            if (at) {
              addSection("ATTENDANCE", ["Employee", "Date", "Hours", "Type", "Status"],
                at.entries.map(e => [`${e.firstName ?? ""} ${e.lastName ?? ""}`.trim(), e.date, e.hoursWorked ?? "", e.type ?? "", e.status]));
            }
            const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
            a.download = `hrpay-report-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
          }}
          className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          <Download className="h-4 w-4" /> Export All
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Headcount", value: hc?.total ?? "—", icon: Users, hero: true },
          { label: "Payroll YTD", value: pr ? fmt(pr.totals.totalGross) : "—", icon: DollarSign },
          { label: "Leave Requests", value: lv?.total ?? "—", icon: CalendarDays },
          { label: "Attendance Entries", value: at?.total ?? "—", icon: Clock },
        ].map(({ label, value, icon: Icon, hero }) => (
          <div key={label} className="rounded-2xl p-4 shadow-sm" style={{ background: hero ? LIME : "white", border: hero ? "none" : "1px solid hsl(220 15% 91%)" }}>
            <div className={`flex size-8 items-center justify-center rounded-lg mb-2 ${hero ? "bg-black/15" : "bg-muted"}`}>
              <Icon className={`h-4 w-4 ${hero ? "text-foreground" : "text-muted-foreground"}`} />
            </div>
            <p className={`text-xs font-medium ${hero ? "text-foreground/70" : "text-muted-foreground"}`}>{label}</p>
            <p className={`text-xl font-bold mt-0.5`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Headcount Report */}
      <Section title="Headcount Report" subtitle={`${hc?.total ?? 0} total employees across all departments`} icon={Users}>
        <div className="pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">By Department</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={deptData} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(220 10% 55%)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(220 10% 55%)" }} width={90} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="count" fill={LIME} radius={[0, 4, 4, 0]} name="Headcount" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">By Employment Type</p>
              {hc && (
                <div className="space-y-2 mt-3">
                  {Object.entries(hc.byType).map(([type, count], i) => (
                    <div key={type} className="flex items-center gap-3">
                      <span className="size-2.5 rounded-sm shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-sm capitalize flex-1">{type.replace("_", " ")}</span>
                      <span className="font-bold text-sm">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">{["Name", "Position", "Department", "Type", "Status", "Start Date", "Salary"].map(h => <th key={h} className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody>
                {(hc?.employees ?? []).slice(0, 15).map(e => (
                  <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2 px-2 font-medium">{e.firstName} {e.lastName}</td>
                    <td className="py-2 px-2 text-muted-foreground">{e.position}</td>
                    <td className="py-2 px-2 text-muted-foreground">{e.departmentName ?? "—"}</td>
                    <td className="py-2 px-2"><span className="rounded-full px-2 py-0.5 text-xs bg-muted capitalize">{e.employmentType.replace("_", " ")}</span></td>
                    <td className="py-2 px-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.status === "active" ? "text-foreground" : "bg-muted text-muted-foreground"}`} style={e.status === "active" ? { background: LIME } : {}}>{e.status}</span></td>
                    <td className="py-2 px-2 text-muted-foreground">{new Date(e.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className="py-2 px-2 font-medium">{e.salary ? fmt(Number(e.salary)) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* Payroll Summary */}
      <Section title="Payroll Summary" subtitle={`${pr?.runs.length ?? 0} completed payroll runs`} icon={DollarSign}>
        <div className="pt-4 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[["Total Gross", pr ? fmt(pr.totals.totalGross) : "—"], ["Total Net", pr ? fmt(pr.totals.totalNet) : "—"], ["Total Tax", pr ? fmt(pr.totals.totalTax) : "—"]].map(([l, v]) => (
              <div key={l} className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">{l}</p>
                <p className="text-lg font-bold text-foreground mt-0.5">{v}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">{["Period", "Gross", "Net", "Tax", "Status"].map(h => <th key={h} className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody>
                {(pr?.runs ?? []).map(r => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-2">{r.periodStart} – {r.periodEnd}</td>
                    <td className="py-2 px-2 font-medium">{r.totalGross ? fmt(Number(r.totalGross)) : "—"}</td>
                    <td className="py-2 px-2">{r.totalNet ? fmt(Number(r.totalNet)) : "—"}</td>
                    <td className="py-2 px-2 text-muted-foreground">{r.totalTax ? fmt(Number(r.totalTax)) : "—"}</td>
                    <td className="py-2 px-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.status === "completed" ? "text-foreground" : "bg-muted text-muted-foreground"}`} style={r.status === "completed" ? { background: LIME } : {}}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* Leave Report */}
      <Section title="Leave Report" subtitle={`${lv?.total ?? 0} total leave requests`} icon={CalendarDays}>
        <div className="pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Days by Leave Type</p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={leaveTypeData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 94%)" vertical={false} />
                  <XAxis dataKey="type" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="days" name="Days" fill={LIME} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">By Status</p>
              {lv && Object.entries(lv.byStatus).map(([status, count], i) => (
                <div key={status} className="flex items-center gap-3 mb-2">
                  <span className="size-2.5 rounded-sm" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-sm capitalize flex-1">{status}</span>
                  <span className="font-bold text-sm">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">{["Employee", "Department", "Type", "Start Date", "Days", "Status"].map(h => <th key={h} className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody>
                {(lv?.requests ?? []).slice(0, 15).map(r => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-2 font-medium">{r.firstName} {r.lastName}</td>
                    <td className="py-2 px-2 text-muted-foreground">{r.departmentName ?? "—"}</td>
                    <td className="py-2 px-2 capitalize">{r.type}</td>
                    <td className="py-2 px-2 text-muted-foreground">{r.startDate}</td>
                    <td className="py-2 px-2">{r.days ?? "1"}</td>
                    <td className="py-2 px-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.status === "approved" ? "text-foreground" : r.status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`} style={r.status === "approved" ? { background: LIME } : {}}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* Attendance Report */}
      <Section title="Attendance Register" subtitle={`${at?.total ?? 0} entries · ${Math.round(at?.totalHours ?? 0).toLocaleString()} total hours`} icon={Clock}>
        <div className="pt-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            {at && Object.entries(at.byStatus).map(([status, count], i) => (
              <div key={status} className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground capitalize">{status}</p>
                <p className="text-lg font-bold text-foreground">{count}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">{["Employee", "Department", "Date", "Hours", "Type", "Status"].map(h => <th key={h} className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody>
                {(at?.entries ?? []).slice(0, 20).map(e => (
                  <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-2 font-medium">{e.firstName} {e.lastName}</td>
                    <td className="py-2 px-2 text-muted-foreground">—</td>
                    <td className="py-2 px-2 text-muted-foreground">{e.date}</td>
                    <td className="py-2 px-2 font-medium">{e.hoursWorked ?? "—"}h</td>
                    <td className="py-2 px-2 capitalize text-muted-foreground">{e.type ?? "—"}</td>
                    <td className="py-2 px-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.status === "approved" ? "text-foreground" : "bg-muted text-muted-foreground"}`} style={e.status === "approved" ? { background: LIME } : {}}>{e.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>
    </div>
  );
}
