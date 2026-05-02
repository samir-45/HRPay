import React from "react";
import { Link, useLocation } from "wouter";
import { Users, LayoutDashboard, Calculator, Clock, CalendarDays, Shield, ListTodo, Building2 } from "lucide-react";
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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="hidden w-64 flex-col bg-sidebar text-sidebar-foreground md:flex shrink-0">
        <div className="flex h-16 shrink-0 items-center px-6 font-bold text-xl tracking-tight text-white border-b border-sidebar-border">
          <div className="size-8 rounded-md bg-primary mr-3 flex items-center justify-center text-primary-foreground">
            H
          </div>
          HRPay
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto py-4">
          <nav className="flex-1 space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground",
                      "mr-3 h-5 w-5 flex-shrink-0"
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-8 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {navigation.find((item) => item.href === location || (item.href !== "/" && location.startsWith(item.href)))?.name || "HRPay"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                AD
              </div>
              <span className="text-sm font-medium text-muted-foreground hidden sm:block">Admin User</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
