import React, { useState } from "react";
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
import { useAuth, apiHeaders } from "@/components/auth-context";
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, DollarSign,
  UserPlus, X, Copy, Check, Loader2, CheckCircle, AlertCircle,
} from "lucide-react";

const LIME = "hsl(82 80% 48%)";

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

function Avatar({ name, avatarUrl, size = 14 }: { name: string; avatarUrl?: string | null; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const hue = (name.charCodeAt(0) * 37) % 360;
  const px = size * 4;
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="shrink-0 rounded-full object-cover"
        style={{ width: px, height: px }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; (e.currentTarget.nextSibling as HTMLElement)!.style.display = "flex"; }}
      />
    );
  }
  return (
    <div
      className="shrink-0 flex items-center justify-center rounded-full font-bold text-white"
      style={{ width: px, height: px, background: `hsl(${hue} 60% 45%)`, fontSize: px * 0.35 }}
    >
      {initials}
    </div>
  );
}

interface InviteResult {
  email: string;
  tempPassword: string;
  acceptUrl: string;
}

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const empId = Number(id);
  const { token } = useAuth();

  const { data: emp, isLoading } = useGetEmployee(empId, { query: { queryKey: getGetEmployeeQueryKey(empId) } });
  const { data: stubs } = useListPayStubs({ employeeId: empId }, { query: { queryKey: getListPayStubsQueryKey({ employeeId: empId }) } });
  const { data: balances } = useListLeaveBalances({ employeeId: empId }, { query: { queryKey: getListLeaveBalancesQueryKey({ employeeId: empId }) } });
  const { data: enrollments } = useListBenefitEnrollments({ employeeId: empId }, { query: { queryKey: getListBenefitEnrollmentsQueryKey({ employeeId: empId }) } });
  const { data: timeEntries } = useListTimeEntries({ employeeId: empId }, { query: { queryKey: getListTimeEntriesQueryKey({ employeeId: empId }) } });

  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null);
  const [inviteError, setInviteError] = useState("");
  const [copied, setCopied] = useState("");

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  }

  async function sendLoginInvite() {
    if (!emp) return;
    setInviting(true);
    setInviteError("");
    try {
      const r = await fetch("/api/companies/invite", {
        method: "POST",
        headers: apiHeaders(token),
        body: JSON.stringify({
          email: emp.email,
          name: `${emp.firstName} ${emp.lastName}`,
          role: "employee",
        }),
      });
      const data = await r.json() as { tempPassword?: string; acceptUrl?: string; error?: string };
      if (!r.ok) {
        setInviteError(data.error ?? "Failed to create invitation");
        return;
      }
      setInviteResult({ email: emp.email, tempPassword: data.tempPassword!, acceptUrl: data.acceptUrl! });
    } catch {
      setInviteError("Something went wrong. Please try again.");
    } finally {
      setInviting(false);
    }
  }

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
            <Avatar name={fullName} avatarUrl={emp.avatarUrl} size={16} />
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

          {/* Login Invite Button */}
          <div className="pt-1 border-t border-border">
            <button
              onClick={() => { setShowInvite(true); setInviteResult(null); setInviteError(""); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:opacity-90 transition-all"
              style={{ background: LIME }}
            >
              <UserPlus className="h-4 w-4" />
              Send Login Invite
            </button>
            <p className="text-[11px] text-muted-foreground text-center mt-2">
              Generates login credentials for this employee
            </p>
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
                  <div key={b.type} className="rounded-lg border border-border p-3">
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

      {/* Login Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-foreground text-lg">Send Login Invite</h3>
              <button onClick={() => setShowInvite(false)} className="p-1.5 rounded-xl hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            {inviteResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Invitation created!</p>
                    <p className="text-xs text-emerald-700">Share these credentials with {fullName}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                  <p className="text-xs font-bold text-foreground mb-2">Login Credentials to Share</p>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Email</p>
                      <p className="text-sm font-mono font-semibold text-foreground">{inviteResult.email}</p>
                    </div>
                    <button onClick={() => copyText(inviteResult.email, "email")} className="p-1.5 rounded hover:bg-muted">
                      {copied === "email" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Temporary Password</p>
                      <p className="text-sm font-mono font-semibold text-foreground">{inviteResult.tempPassword}</p>
                    </div>
                    <button onClick={() => copyText(inviteResult.tempPassword, "pw")} className="p-1.5 rounded hover:bg-muted">
                      {copied === "pw" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Login URL</p>
                      <p className="text-xs font-mono text-foreground truncate max-w-48">{window.location.origin}/login</p>
                    </div>
                    <button onClick={() => copyText(`${window.location.origin}/login`, "url")} className="p-1.5 rounded hover:bg-muted">
                      {copied === "url" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  The employee must visit the login URL and use these credentials. They can change their password from Settings after logging in.
                </p>

                <button onClick={() => setShowInvite(false)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-foreground hover:opacity-90"
                  style={{ background: LIME }}>
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar name={fullName} avatarUrl={emp.avatarUrl} size={10} />
                    <div>
                      <p className="font-semibold text-foreground text-sm">{fullName}</p>
                      <p className="text-xs text-muted-foreground">{emp.email}</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  This will generate a temporary password for <span className="font-semibold text-foreground">{fullName}</span>. Share the credentials with them so they can log in to HRPay.
                </p>

                {inviteError && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <p className="text-sm text-destructive">{inviteError}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowInvite(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted">
                    Cancel
                  </button>
                  <button onClick={sendLoginInvite} disabled={inviting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-foreground disabled:opacity-50 hover:opacity-90"
                    style={{ background: LIME }}>
                    {inviting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <><UserPlus className="h-4 w-4" /> Send Invite</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
