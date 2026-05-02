import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Users, LayoutDashboard, Calculator, Clock,
  CalendarDays, Shield, ListTodo, Building2,
  Search, Bell, LogOut, Zap, Briefcase,
  Target, FileText, Settings, Megaphone,
  Receipt, Package, GraduationCap, Network,
  CheckCheck, Info, AlertCircle, PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, apiHeaders } from "@/components/auth-context";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Payroll", href: "/payroll", icon: Calculator },
  { name: "Time & Attendance", href: "/time", icon: Clock },
  { name: "Leave Management", href: "/leave", icon: CalendarDays },
  { name: "Recruitment", href: "/recruitment", icon: Briefcase },
  { name: "Performance", href: "/performance", icon: Target },
  { name: "Benefits", href: "/benefits", icon: Shield },
  { name: "Onboarding", href: "/onboarding", icon: ListTodo },
  { name: "Departments", href: "/departments", icon: Building2 },
  { name: "Announcements", href: "/announcements", icon: Megaphone },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Assets", href: "/assets", icon: Package },
  { name: "Training", href: "/training", icon: GraduationCap },
  { name: "Org Chart", href: "/org-chart", icon: Network },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: string;
  createdAt: string;
  authorName?: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const PRIORITY_ICON: Record<string, React.ElementType> = {
  urgent: AlertCircle,
  high: AlertCircle,
  normal: Info,
  low: PartyPopper,
};

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "text-red-500",
  high: "text-orange-500",
  normal: "text-blue-500",
  low: "text-emerald-500",
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
    fetch("/api/announcements", { headers: apiHeaders(token) })
      .then(r => r.json())
      .then((data: Announcement[]) => setAnnouncements(Array.isArray(data) ? data.slice(0, 10) : []))
      .catch(() => {});
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
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    localStorage.setItem("hrpay_read_notifs", JSON.stringify([...next]));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex size-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Bell className="h-3.5 w-3.5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex size-2 items-center justify-center rounded-full text-[8px] font-bold text-foreground" style={{ background: "hsl(82 80% 48%)" }} />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-2xl border border-border bg-white shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-foreground" />
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              {unread > 0 && (
                <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-foreground" style={{ background: "hsl(82 80% 48%)" }}>
                  {unread}
                </span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                <CheckCheck className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {announcements.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <Bell className="h-6 w-6 mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              announcements.map(a => {
                const isRead = readIds.has(a.id);
                const Icon = PRIORITY_ICON[a.priority] ?? Info;
                const color = PRIORITY_COLOR[a.priority] ?? "text-blue-500";
                return (
                  <button
                    key={a.id}
                    onClick={() => markRead(a.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/40 transition-colors",
                      !isRead && "bg-lime-50/60"
                    )}
                  >
                    <div className={cn("mt-0.5 shrink-0", color)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={cn("text-xs font-semibold text-foreground truncate", !isRead && "font-bold")}>{a.title}</p>
                        {!isRead && <span className="size-1.5 rounded-full shrink-0" style={{ background: "hsl(82 80% 48%)" }} />}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">{a.content}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo(a.createdAt)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {announcements.length > 0 && (
            <div className="border-t border-border px-4 py-2.5">
              <Link href="/announcements" onClick={() => setOpen(false)} className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors">
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

  const activeItem = navigation.find(
    (item) => item.href === location || (item.href !== "/" && location.startsWith(item.href))
  );

  const initials = user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "AD";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "hsl(220 20% 96%)" }}>
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col bg-white border-r border-border">
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center px-4 gap-2.5 border-b border-border">
          <div className="flex gap-1">
            <div className="size-3.5 rounded-full" style={{ background: "hsl(82 80% 48%)" }} />
            <div className="size-3.5 rounded-full bg-foreground" />
          </div>
          <span className="text-sm font-bold tracking-tight text-foreground">HRPay</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col overflow-y-auto px-2.5 py-2 gap-0.5">
          {navigation.map((item) => {
            const isActive =
              location === item.href ||
              (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-all",
                  isActive
                    ? "bg-foreground text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-white" : "text-muted-foreground")} />
                {item.name}
              </Link>
            );
          })}

          <div className="flex-1" />

          <button
            onClick={logout}
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all w-full text-left"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            Logout
          </button>
        </nav>

        {/* Upgrade card */}
        <div className="mx-2.5 mb-3 rounded-2xl p-3.5 text-center" style={{ background: "hsl(82 80% 48%)" }}>
          <div className="mx-auto mb-1.5 flex size-8 items-center justify-center rounded-full bg-black/15">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <p className="text-xs font-bold text-foreground mb-0.5">Get Pro Access</p>
          <p className="text-[10px] text-foreground/70 mb-2 leading-snug">
            Explore exclusive premium features
          </p>
          <button className="w-full rounded-xl bg-foreground px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-foreground/90 transition-colors">
            Upgrade $52
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between bg-white border-b border-border px-5">
          <div>
            <h1 className="text-sm font-bold text-foreground tracking-tight">
              {activeItem?.name ?? "HRPay"}
            </h1>
            <p className="text-[10px] text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button className="flex size-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Search className="h-3.5 w-3.5" />
            </button>
            <NotificationBell token={token} />
            <div className="flex items-center gap-2 pl-2 border-l border-border ml-0.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-foreground text-white text-[11px] font-bold">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-foreground leading-none">{user?.name ?? "Admin User"}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{user?.role?.replace("_", " ") ?? "Admin"}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
