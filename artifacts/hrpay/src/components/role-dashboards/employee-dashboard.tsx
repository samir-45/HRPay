import React from "react";
import { useAuth } from "@/components/auth-context";
import { Link } from "wouter";
import {
  CalendarDays, Clock, DollarSign, User, CheckCircle2,
  AlertCircle, ArrowRight, BookOpen, Shield,
} from "lucide-react";
import {
  useGetLeaveSummary,
  useGetUpcomingEvents,
} from "@workspace/api-client-react";

const LIME = "hsl(82 80% 48%)";

function StatCard({ icon: Icon, label, value, sub, href, highlight }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; href?: string; highlight?: boolean;
}) {
  const content = (
    <div className={`rounded-2xl p-5 shadow-sm flex flex-col gap-3 ${highlight ? "" : "bg-white border border-border"}`}
      style={highlight ? { background: LIME } : {}}>
      <div className="flex items-center justify-between">
        <div className={`flex size-9 items-center justify-center rounded-xl ${highlight ? "bg-black/15" : "bg-muted"}`}>
          <Icon className={`h-4 w-4 ${highlight ? "text-foreground" : "text-muted-foreground"}`} />
        </div>
        {href && <ArrowRight className={`h-4 w-4 ${highlight ? "text-foreground/50" : "text-muted-foreground"}`} />}
      </div>
      <div>
        <p className={`text-xs font-medium ${highlight ? "text-foreground/70" : "text-muted-foreground"}`}>{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${highlight ? "text-foreground" : "text-foreground"}`}>{value}</p>
        {sub && <p className={`text-xs mt-0.5 ${highlight ? "text-foreground/60" : "text-muted-foreground"}`}>{sub}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const leaveSummary = useGetLeaveSummary();
  const events = useGetUpcomingEvents();

  const ls = leaveSummary.data ?? [];
  const ev = events.data ?? [];
  const totalLeave = ls.reduce((a, l) => a + l.count, 0);

  const initials = user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "ME";

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-2xl p-6 flex items-center gap-5 bg-white border border-border shadow-sm">
        <div className="size-14 shrink-0 rounded-2xl bg-foreground flex items-center justify-center text-white text-xl font-bold">
          {initials}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-extrabold text-foreground">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {user?.name?.split(" ")[0]}!</h2>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">
            {user?.role?.replace(/_/g, " ")} · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 text-xs font-medium text-muted-foreground">
          <div className="size-2 rounded-full bg-emerald-500" />
          Active
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarDays} label="Leave Requests" value={totalLeave} sub="All time" href="/leave" highlight />
        <StatCard icon={Clock} label="Time Tracking" value="Active" sub="Clock in / out" href="/time" />
        <StatCard icon={Shield} label="Benefits" value="Enrolled" sub="View your plans" href="/benefits" />
        <StatCard icon={BookOpen} label="Training" value="Explore" sub="Available courses" href="/training" />
      </div>

      {/* Leave breakdown + Upcoming events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Leave by type */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">My Leave History</h3>
            <Link href="/leave" className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
          </div>
          {ls.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No leave requests yet
            </div>
          ) : (
            <div className="space-y-3">
              {ls.map((l, i) => (
                <div key={l.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-2.5 rounded-sm" style={{ background: i === 0 ? LIME : i === 1 ? "#1a1a1a" : "#94a3b8" }} />
                    <span className="text-sm capitalize text-foreground">{l.type}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden" style={{ width: 80 }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min((l.count / Math.max(totalLeave, 1)) * 100, 100)}%`, background: i === 0 ? LIME : i === 1 ? "#1a1a1a" : "#94a3b8" }} />
                    </div>
                    <span className="text-sm font-semibold text-foreground w-6 text-right">{l.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <Link href="/leave" className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold text-foreground hover:opacity-90 transition-all" style={{ background: LIME }}>
              <AlertCircle className="h-4 w-4" /> Request Leave
            </Link>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-bold text-foreground mb-4">Upcoming Events</h3>
          {ev.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No upcoming events
            </div>
          ) : (
            <div className="space-y-3">
              {ev.slice(0, 5).map((e: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl text-white text-[11px] font-bold" style={{ background: LIME }}>
                    {new Date(e.date).getDate()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{e.title ?? e.type}</p>
                    <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/time", icon: Clock, label: "Log Time" },
          { href: "/expenses", icon: DollarSign, label: "Submit Expense" },
          { href: "/onboarding", icon: CheckCircle2, label: "My Tasks" },
          { href: "/org-chart", icon: User, label: "Org Chart" },
        ].map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-border hover:shadow-md transition-all text-center">
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="text-xs font-semibold text-foreground">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

