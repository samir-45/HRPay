import React from "react";
import { Link, useLocation } from "wouter";
import {
  Users, LayoutDashboard, Calculator, Clock,
  CalendarDays, Shield, ListTodo, Building2,
  Search, Bell, LogOut, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Payroll", href: "/payroll", icon: Calculator },
  { name: "Time & Attendance", href: "/time", icon: Clock },
  { name: "Leave Management", href: "/leave", icon: CalendarDays },
  { name: "Benefits", href: "/benefits", icon: Shield },
  { name: "Onboarding", href: "/onboarding", icon: ListTodo },
  { name: "Departments", href: "/departments", icon: Building2 },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const activeItem = navigation.find(
    (item) => item.href === location || (item.href !== "/" && location.startsWith(item.href))
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "hsl(220 20% 96%)" }}>
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-white border-r border-border">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center px-5 gap-2.5">
          <div className="flex gap-1">
            <div className="size-4 rounded-full" style={{ background: "hsl(82 80% 48%)" }} />
            <div className="size-4 rounded-full bg-foreground" />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">HRPay</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-3 gap-0.5">
          {navigation.map((item) => {
            const isActive =
              location === item.href ||
              (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-foreground text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-muted-foreground")}
                />
                {item.name}
              </Link>
            );
          })}

          <div className="mt-auto" />

          {/* Logout */}
          <button className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all w-full text-left">
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </button>
        </nav>

        {/* Upgrade card */}
        <div className="mx-3 mb-4 rounded-2xl p-4 text-center" style={{ background: "hsl(82 80% 48%)" }}>
          <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-black/15">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <p className="text-sm font-bold text-foreground mb-0.5">Get Pro Access</p>
          <p className="text-xs text-foreground/70 mb-3 leading-snug">
            Explore the exclusive features of a premium account
          </p>
          <button className="w-full rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-white hover:bg-foreground/90 transition-colors">
            Upgrade $52
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between bg-white border-b border-border px-6">
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              {activeItem?.name ?? "HRPay"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <button className="flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Search className="h-4 w-4" />
            </button>
            {/* Bell */}
            <button className="relative flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full" style={{ background: "hsl(82 80% 48%)" }} />
            </button>
            {/* Avatar */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-border ml-1">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-white text-xs font-bold">
                AD
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-foreground leading-none">Admin User</p>
                <p className="text-xs text-muted-foreground mt-0.5">Admin Store</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
