import React from "react";
import { useAuth } from "@/components/auth-context";
import { Link } from "wouter";
import {
  Clock, CalendarDays, CheckCircle2, AlertCircle, ArrowRight, Users,
} from "lucide-react";
import { useGetDashboardSummary, useGetLeaveSummary } from "@workspace/api-client-react";

const LIME = "hsl(82 80% 48%)";

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const summary = useGetDashboardSummary();
  const leaveSummary = useGetLeaveSummary();
  const s = summary.data;
  const ls = leaveSummary.data ?? [];

  const approvalItems = [
    { label: "Pending leave requests", count: s?.pendingLeaveRequests ?? 0, href: "/leave", urgent: (s?.pendingLeaveRequests ?? 0) > 0 },
    { label: "Pending time entries", count: s?.pendingTimeEntries ?? 0, href: "/time", urgent: (s?.pendingTimeEntries ?? 0) > 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl p-5 flex items-center justify-between bg-white border border-border shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-foreground">Supervisor Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Welcome, {user?.name?.split(" ")[0]}. You have{" "}
            <span className="font-semibold text-foreground">
              {(s?.pendingLeaveRequests ?? 0) + (s?.pendingTimeEntries ?? 0)}
            </span>{" "}
            pending action{(s?.pendingLeaveRequests ?? 0) + (s?.pendingTimeEntries ?? 0) !== 1 ? "s" : ""} today.
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Priority Approvals */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">Action Required</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {approvalItems.map(({ label, count, href, urgent }) => (
            <Link key={href} href={href} className={`rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all ${urgent ? "" : "bg-white border border-border"}`}
              style={urgent ? { background: LIME } : {}}>
              <div className={`flex size-11 items-center justify-center rounded-2xl ${urgent ? "bg-black/15" : "bg-muted"}`}>
                {urgent ? <AlertCircle className="h-5 w-5 text-foreground" /> : <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              </div>
              <div className="flex-1">
                <p className={`text-2xl font-extrabold ${urgent ? "text-foreground" : "text-foreground"}`}>{count}</p>
                <p className={`text-xs font-medium ${urgent ? "text-foreground/70" : "text-muted-foreground"}`}>{label}</p>
              </div>
              <ArrowRight className={`h-4 w-4 ${urgent ? "text-foreground/50" : "text-muted-foreground"}`} />
            </Link>
          ))}
        </div>
      </div>

      {/* Leave breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Leave by Type</h3>
            <Link href="/leave" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {ls.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No leave data</div>
          ) : (
            <div className="space-y-3">
              {ls.map((l, i) => {
                const total = ls.reduce((a, x) => a + x.count, 0) || 1;
                const colors = [LIME, "#1a1a1a", "#94a3b8", "#cbd5e1"];
                return (
                  <div key={l.type} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="capitalize font-medium text-foreground">{l.type}</span>
                      <span className="text-muted-foreground">{l.count} request{l.count !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(l.count / total) * 100}%`, background: colors[i % colors.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-bold text-foreground mb-4">Quick Navigation</h3>
          <div className="space-y-2">
            {[
              { href: "/time", icon: Clock, label: "Time Approvals", badge: s?.pendingTimeEntries },
              { href: "/leave", icon: CalendarDays, label: "Leave Approvals", badge: s?.pendingLeaveRequests },
              { href: "/employees", icon: Users, label: "Employee Directory" },
              { href: "/announcements", icon: AlertCircle, label: "Announcements" },
            ].map(({ href, icon: Icon, label, badge }) => (
              <Link key={href} href={href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-all">
                <div className="flex size-8 items-center justify-center rounded-xl bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
                {badge != null && badge > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: LIME, color: "hsl(82 60% 20%)" }}>
                    {badge}
                  </span>
                )}
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
