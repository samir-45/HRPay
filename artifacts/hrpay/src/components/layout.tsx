import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Users, LayoutDashboard, Calculator, Clock,
  CalendarDays, Shield, ListTodo, Building2,
  Search, Bell, LogOut, Zap, Briefcase,
  Target, FileText, Settings, Megaphone,
  Receipt, Package, GraduationCap, Network,
  CheckCheck, Info, AlertCircle, PartyPopper,
  UserCog, LockKeyhole, BarChart3, HelpCircle, Menu, X as XClose, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, apiHeaders } from "@/components/auth-context";
import { usePermissions, FeatureKey } from "@/components/permissions-context";
import { useSubscription } from "@/components/subscription-context";
import { PLAN_LABELS, PLAN_COLORS, requiredPlanFor } from "@/lib/plan-features";

const ADMIN_ROLES = ["company_admin", "ceoo", "manager", "supervisor"];
const MANAGER_ROLES = ["company_admin", "ceoo", "manager"];

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: string[] | null;
  feature: FeatureKey | null;
};

const baseNavigation: NavItem[] = [
  { name: "Dashboard",         href: "/dashboard",     icon: LayoutDashboard, roles: null,                feature: null },
  { name: "Permissions",       href: "/permissions",   icon: LockKeyhole,     roles: ["company_admin"],   feature: null },
  { name: "AI Insights",       href: "/insights",      icon: Sparkles,        roles: ["company_admin"],   feature: null },
  { name: "Team",              href: "/team",          icon: UserCog,         roles: MANAGER_ROLES,       feature: "team" },
  { name: "Employees",         href: "/employees",     icon: Users,           roles: ADMIN_ROLES,         feature: "employees" },
  { name: "Payroll",           href: "/payroll",       icon: Calculator,      roles: ADMIN_ROLES,         feature: "payroll" },
  { name: "Time & Attendance", href: "/time",          icon: Clock,           roles: null,                feature: "time" },
  { name: "Leave Management",  href: "/leave",         icon: CalendarDays,    roles: null,                feature: "leave" },
  { name: "Recruitment",       href: "/recruitment",   icon: Briefcase,       roles: ADMIN_ROLES,         feature: "recruitment" },
  { name: "Performance",       href: "/performance",   icon: Target,          roles: null,                feature: "performance" },
  { name: "Benefits",          href: "/benefits",      icon: Shield,          roles: null,                feature: "benefits" },
  { name: "Onboarding",        href: "/onboarding",    icon: ListTodo,        roles: MANAGER_ROLES,       feature: "onboarding" },
  { name: "Departments",       href: "/departments",   icon: Building2,       roles: MANAGER_ROLES,       feature: "departments" },
  { name: "Announcements",     href: "/announcements", icon: Megaphone,       roles: null,                feature: "announcements" },
  { name: "Expenses",          href: "/expenses",      icon: Receipt,         roles: null,                feature: "expenses" },
  { name: "Assets",            href: "/assets",        icon: Package,         roles: null,                feature: "assets" },
  { name: "Training",          href: "/training",      icon: GraduationCap,   roles: null,                feature: "training" },
  { name: "Org Chart",         href: "/org-chart",     icon: Network,         roles: null,                feature: "org-chart" },
  { name: "Reports",           href: "/reports",       icon: BarChart3,       roles: ADMIN_ROLES,         feature: "reports" },
  { name: "Settings",          href: "/settings",      icon: Settings,        roles: null,                feature: null },
];

interface Announcement {
  id: number; title: string; content: string; type: string;
  createdAt: string; publishedBy?: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  urgent: AlertCircle, warning: AlertCircle, info: Info,
  success: CheckCheck, celebration: PartyPopper,
};
const TYPE_COLOR: Record<string, string> = {
  urgent: "text-red-500", warning: "text-orange-500", info: "text-blue-500",
  success: "text-emerald-500", celebration: "text-lime-600",
};

function NotificationBell({ token }: { token: string | null }) {
  const [open, setOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [readIds, setReadIds] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("hrpay_read_notifs") ?? "[]")); }
    catch { return new Set(); }
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    function load() {
      fetch("/api/announcements", { headers: apiHeaders(token!) })
        .then(r => r.json())
        .then((data: Announcement[]) => setAnnouncements(Array.isArray(data) ? data.slice(0, 10) : []))
        .catch(() => {});
    }
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const unread = announcements.filter(a => !readIds.has(a.id)).length;

  function markAllRead() {
    const all = new Set(announcements.map(a => a.id));
    setReadIds(all);
    localStorage.setItem("hrpay_read_notifs", JSON.stringify([...all]));
  }
  function markRead(id: number) {
    const next = new Set(readIds); next.add(id);
    setReadIds(next);
    localStorage.setItem("hrpay_read_notifs", JSON.stringify([...next]));
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="relative flex size-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
        <Bell className="h-3.5 w-3.5" />
        {unread > 0 && <span className="absolute top-1 right-1 flex size-2 rounded-full" style={{ background: "hsl(82 80% 48%)" }} />}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-2xl border border-border bg-white shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-foreground" />
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              {unread > 0 && <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-foreground" style={{ background: "hsl(82 80% 48%)" }}>{unread}</span>}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                <CheckCheck className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {announcements.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <Bell className="h-6 w-6 mx-auto mb-2 opacity-30" />No notifications yet
              </div>
            ) : announcements.map(a => {
              const isRead = readIds.has(a.id);
              const Icon = TYPE_ICON[a.type] ?? Info;
              return (
                <button key={a.id} onClick={() => markRead(a.id)}
                  className={cn("w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/40 transition-colors", !isRead && "bg-lime-50/60")}>
                  <div className={cn("mt-0.5 shrink-0", TYPE_COLOR[a.type] ?? "text-blue-500")}><Icon className="h-3.5 w-3.5" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={cn("text-xs font-semibold text-foreground truncate", !isRead && "font-bold")}>{a.title}</p>
                      {!isRead && <span className="size-1.5 rounded-full shrink-0" style={{ background: "hsl(82 80% 48%)" }} />}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{a.content}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo(a.createdAt)}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {announcements.length > 0 && (
            <div className="border-t border-border px-4 py-2.5">
              <Link href="/announcements" onClick={() => setOpen(false)} className="text-[11px] font-medium text-muted-foreground hover:text-foreground">
                View all announcements →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout, token } = useAuth();
  const { hasFeature } = usePermissions();
  const { plan, planHasFeature } = useSubscription();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user?.role === "company_admin";

  /* Split nav into accessible and plan-locked items */
  const visibleNav = baseNavigation.filter(item => {
    if (item.roles !== null && (!user?.role || !item.roles.includes(user.role))) return false;
    if (item.feature !== null && !hasFeature(item.feature)) return false;
    return true;
  });

  /* Plan-locked items: only show to company_admin so they can see what to upgrade for */
  const lockedNav = isAdmin
    ? baseNavigation.filter(item => {
        if (item.feature === null) return false;
        if (item.roles !== null && !item.roles.includes(user!.role)) return false;
        if (planHasFeature(item.feature)) return false;
        return true;
      })
    : [];

  const activeItem = visibleNav.find(
    item => item.href === location || (item.href !== "/" && location.startsWith(item.href))
  );

  const initials = user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "AD";
  const planLabel = user?.role === "company_admin" ? "Company Admin" : user?.role?.replace(/_/g, " ") ?? "User";

  function SidebarNav({ onNavClick }: { onNavClick?: () => void }) {
    return (
      <>
        <nav className="flex flex-1 flex-col overflow-y-auto px-2.5 py-2 gap-0.5">
          {visibleNav.map(item => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href} onClick={onNavClick}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-all",
                  isActive ? "bg-foreground text-white shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}>
                <item.icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-white" : "text-muted-foreground")} />
                {item.name}
              </Link>
            );
          })}
          {lockedNav.length > 0 && (
            <>
              <div className="px-2.5 pt-3 pb-1">
                <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">Upgrade to unlock</p>
              </div>
              {lockedNav.map(item => {
                const reqPlan = item.feature ? requiredPlanFor(item.feature) : "starter";
                const badge = PLAN_LABELS[reqPlan];
                const badgeColor = reqPlan === "pro" ? "bg-violet-100 text-violet-600" : "bg-blue-100 text-blue-600";
                return (
                  <Link key={item.name} href={`/upgrade?feature=${item.feature}`} onClick={onNavClick}
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-muted-foreground/50 hover:bg-muted/40 transition-all group">
                    <item.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                    <span className="flex-1 truncate">{item.name}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
                  </Link>
                );
              })}
            </>
          )}
          <div className="flex-1" />
          <Link href="/help" onClick={onNavClick}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-all",
              location === "/help" ? "bg-foreground text-white shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}>
            <HelpCircle className={cn("h-3.5 w-3.5 shrink-0", location === "/help" ? "text-white" : "text-muted-foreground")} />
            Help Center
          </Link>
          <button onClick={() => { onNavClick?.(); logout(); }}
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all w-full text-left">
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            Logout
          </button>
        </nav>
        {plan !== "pro" && (
          <Link href="/upgrade" onClick={onNavClick}
            className="mx-2.5 mb-3 rounded-2xl p-3.5 text-center block hover:opacity-90 transition-all"
            style={{ background: "hsl(82 80% 48%)" }}>
            <div className="mx-auto mb-1.5 flex size-8 items-center justify-center rounded-full bg-black/15">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <p className="text-xs font-bold text-foreground mb-0.5">
              {plan === "free" ? "Upgrade to Starter" : "Upgrade to Pro"}
            </p>
            <p className="text-[10px] text-foreground/70 mb-2 leading-snug">
              {plan === "free" ? "Unlock payroll, benefits & more" : "Unlock recruitment, reports & more"}
            </p>
            <span className="w-full inline-block rounded-xl bg-foreground px-3 py-1.5 text-[10px] font-semibold text-white">
              View Plans
            </span>
          </Link>
        )}
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "hsl(220 20% 96%)" }}>
      {/* Mobile overlay drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white flex flex-col shadow-2xl">
            <div className="flex h-14 shrink-0 items-center justify-between px-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1">
                  <div className="size-3.5 rounded-full" style={{ background: "hsl(82 80% 48%)" }} />
                  <div className="size-3.5 rounded-full bg-foreground" />
                </div>
                <span className="text-sm font-bold tracking-tight text-foreground">HRPay</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted">
                <XClose className="h-4 w-4" />
              </button>
            </div>
            <SidebarNav onNavClick={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col bg-white border-r border-border">
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center px-4 gap-2.5 border-b border-border">
          <div className="flex gap-1">
            <div className="size-3.5 rounded-full" style={{ background: "hsl(82 80% 48%)" }} />
            <div className="size-3.5 rounded-full bg-foreground" />
          </div>
          <span className="text-sm font-bold tracking-tight text-foreground">HRPay</span>
          {user?.companyId && (
            <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${PLAN_COLORS[plan]}`}>
              {PLAN_LABELS[plan]}
            </span>
          )}
        </div>
        <SidebarNav />
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between bg-white border-b border-border px-4 md:px-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted">
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-foreground tracking-tight">{activeItem?.name ?? "HRPay"}</h1>
              <p className="text-[10px] text-muted-foreground hidden sm:block">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="flex size-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Search className="h-3.5 w-3.5" />
            </button>
            <NotificationBell token={token} />
            <div className="flex items-center gap-2 pl-2 border-l border-border ml-0.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-foreground text-white text-[11px] font-bold">{initials}</div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-foreground leading-none">{user?.name ?? "Admin User"}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{planLabel}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
