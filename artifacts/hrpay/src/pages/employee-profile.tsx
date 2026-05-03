import React from "react";
import { useParams, Link } from "wouter";
import { SkeletonEmployeeProfile } from "@/components/skeletons";
import {
  useGetEmployee,
  useListPayStubs,
  useListLeaveBalances,
  useListBenefitEnrollments,
  useListTimeEntries,
  getGetEmployeeQueryKey,
  getListPayStubsQueryKey,
  getListLeaveBalancesQueryKey,
  getListBenefitEnrollmentsQueryKey,
  getListTimeEntriesQueryKey,
} from "@workspace/api-client-react";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, DollarSign } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-gray-100 text-gray-600",
  on_leave: "bg-amber-100 text-amber-700",
  terminated: "bg-red-100 text-red-600",
};

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function Avatar({ name, size = 14 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const hue = (name.charCodeAt(0) * 37) % 360;
  return (
    <div className={`flex size-${size} shrink-0 items-center justify-center rounded-full text-xl font-bold text-white`} style={{ background: `hsl(${hue} 60% 45%)` }}>
      {initials}
    </div>
  );
}

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const empId = Number(id);

  const { data: emp, isLoading } = useGetEmployee(empId, { query: { queryKey: getGetEmployeeQueryKey(empId) } });
  const { data: stubs } = useListPayStubs({ employeeId: empId }, { query: { queryKey: getListPayStubsQueryKey({ employeeId: empId }) } });
  const { data: balances } = useListLeaveBalances({ employeeId: empId }, { query: { queryKey: getListLeaveBalancesQueryKey({ employeeId: empId }) } });
  const { data: enrollments } = useListBenefitEnrollments({ employeeId: empId }, { query: { queryKey: getListBenefitEnrollmentsQueryKey({ employeeId: empId }) } });
  const { data: timeEntries } = useListTimeEntries({ employeeId: empId, limit: 10 }, { query: { queryKey: getListTimeEntriesQueryKey({ employeeId: empId, limit: 10 }) } });

  if (isLoading) return <SkeletonEmployeeProfile />;
  if (!emp) return <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Employee not found.</div>;

  const fullName = `${emp.firstName} ${emp.lastName}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/employees" className="p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h2 className="text-lg font-semibold">{fullName}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-border p-6 space-y-5">
          <div className="flex flex-col items-center text-center gap-3">
            <Avatar name={fullName} size={16} />
            <div>
              <h3 className="font-semibold text-lg text-foreground">{fullName}</h3>
              <p className="text-sm text-muted-foreground">{emp.position}</p>
              {emp.departmentName && <p className="text-xs text-muted-foreground">{emp.departmentName}</p>}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[emp.status] ?? "bg-gray-100"}`}>
              {emp.status.replace("_", " ")}
            </span>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{emp.email}</span>
            </div>
            {emp.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <span>{emp.phone}</span>
              </div>
            )}
            {(emp.city || emp.state) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{[emp.city, emp.state].filter(Boolean).join(", ")}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>Started {emp.startDate}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Briefcase className="h-4 w-4 shrink-0" />
              <span>{emp.employmentType?.replace("_", " ")}</span>
            </div>
            {emp.salary && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4 shrink-0" />
                <span>{fmt(Number(emp.salary))} / {emp.salaryType === "hourly" ? "hr" : "yr"}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Leave Balances */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h4 className="font-semibold text-foreground mb-4">Leave Balances</h4>
            {(balances ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No leave balances recorded.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(balances ?? []).map((b) => (
                  <div key={b.id} className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground capitalize">{b.type}</p>
                    <p className="text-xl font-bold text-foreground">{b.remaining}</p>
                    <p className="text-xs text-muted-foreground">{b.used} used of {b.allocated}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Benefits */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h4 className="font-semibold text-foreground mb-4">Enrolled Benefits</h4>
            {(enrollments ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No benefits enrolled.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(enrollments ?? []).filter(e => e.isActive).map((e) => (
                  <span key={e.id} className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                    {e.planName}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Pay History */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h4 className="font-semibold text-foreground mb-4">Recent Pay History</h4>
            {(stubs ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No pay stubs yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left pb-2 font-medium text-muted-foreground">Period</th>
                    <th className="text-right pb-2 font-medium text-muted-foreground">Gross</th>
                    <th className="text-right pb-2 font-medium text-muted-foreground">Taxes</th>
                    <th className="text-right pb-2 font-medium text-muted-foreground">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(stubs ?? []).slice(0, 5).map((s) => (
                    <tr key={s.id}>
                      <td className="py-2.5 text-muted-foreground">{s.payDate ?? "—"}</td>
                      <td className="py-2.5 text-right font-medium">{fmt(s.grossPay)}</td>
                      <td className="py-2.5 text-right text-muted-foreground">{fmt((s.federalTax ?? 0) + (s.stateTax ?? 0))}</td>
                      <td className="py-2.5 text-right font-semibold text-emerald-700">{fmt(s.netPay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent Time Entries */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h4 className="font-semibold text-foreground mb-4">Recent Time Entries</h4>
            {(timeEntries ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No time entries.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left pb-2 font-medium text-muted-foreground">Date</th>
                    <th className="text-right pb-2 font-medium text-muted-foreground">Hours</th>
                    <th className="text-right pb-2 font-medium text-muted-foreground">OT</th>
                    <th className="text-right pb-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(timeEntries ?? []).slice(0, 5).map((t) => (
                    <tr key={t.id}>
                      <td className="py-2.5 text-muted-foreground">{t.date}</td>
                      <td className="py-2.5 text-right font-medium">{t.hoursWorked ?? "—"}h</td>
                      <td className="py-2.5 text-right text-muted-foreground">{t.overtimeHours ?? 0}h</td>
                      <td className="py-2.5 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.status === "approved" ? "bg-emerald-100 text-emerald-700" : t.status === "rejected" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
