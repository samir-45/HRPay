import React from "react";
import { Link, useLocation } from "wouter";
import {
  Users, LayoutDashboard, Calculator, Clock,
  CalendarDays, Shield, ListTodo, Building2,
  Search, Bell, LogOut, Zap, Briefcase,
  Target, FileText, Settings, Megaphone,
  Receipt, Package, GraduationCap, Network,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-context";

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

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

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
            <button className="relative flex size-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Bell className="h-3.5 w-3.5" />
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full" style={{ background: "hsl(82 80% 48%)" }} />
            </button>
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
