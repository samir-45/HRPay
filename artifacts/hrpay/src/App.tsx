import React from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout";
import { AuthProvider, useAuth } from "@/components/auth-context";
import { PermissionsProvider } from "@/components/permissions-context";
import { SubscriptionProvider } from "@/components/subscription-context";
import { AIAssistant } from "@/components/ai-assistant";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import RegisterCompany from "@/pages/register-company";
import AcceptInvite from "@/pages/accept-invite";
import SuperAdmin from "@/pages/super-admin";
import TeamManagement from "@/pages/team-management";
import Dashboard from "@/pages/dashboard";
import Employees from "@/pages/employees";
import EmployeeNew from "@/pages/employee-new";
import EmployeeProfile from "@/pages/employee-profile";
import Payroll from "@/pages/payroll";
import PayrollDetail from "@/pages/payroll-detail";
import Time from "@/pages/time";
import Leave from "@/pages/leave";
import Benefits from "@/pages/benefits";
import Onboarding from "@/pages/onboarding";
import Departments from "@/pages/departments";
import Recruitment from "@/pages/recruitment";
import Performance from "@/pages/performance";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Announcements from "@/pages/announcements";
import Expenses from "@/pages/expenses";
import Assets from "@/pages/assets";
import Training from "@/pages/training";
import OrgChart from "@/pages/org-chart";
import Permissions from "@/pages/permissions";
import Upgrade from "@/pages/upgrade";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center" style={{ background: "hsl(220 20% 96%)" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 rounded-full animate-spin border-2 border-muted" style={{ borderTopColor: "hsl(82 80% 48%)" }} />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component, allowedRoles }: { component: React.ComponentType; allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Redirect to="/dashboard" />;
  return (
    <AppLayout>
      <Component />
      <AIAssistant />
    </AppLayout>
  );
}

function SuperAdminRoute({ page }: { page?: string }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login?portal=admin" />;
  if (user.role !== "super_admin") return <Redirect to="/" />;
  return <SuperAdmin page={page} />;
}

function Router() {
  const { user, isLoading } = useAuth();
  return (
    <Switch>
      <Route path="/register" component={RegisterCompany} />
      <Route path="/accept-invite" component={AcceptInvite} />
      <Route path="/login">
        {!isLoading && user && user.role !== "super_admin" ? <Redirect to="/dashboard" /> : <Login />}
      </Route>

      <Route path="/super-admin/companies"     component={() => <SuperAdminRoute page="companies" />} />
      <Route path="/super-admin/subscriptions" component={() => <SuperAdminRoute page="subscriptions" />} />
      <Route path="/super-admin/users"         component={() => <SuperAdminRoute page="users" />} />
      <Route path="/super-admin/settings"      component={() => <SuperAdminRoute page="settings" />} />
      <Route path="/super-admin"               component={() => <SuperAdminRoute page="overview" />} />

      <Route path="/" component={Landing} />
      <Route path="/dashboard"   component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/upgrade"     component={() => <ProtectedRoute component={Upgrade} />} />
      <Route path="/permissions" component={() => <ProtectedRoute component={Permissions} allowedRoles={["company_admin"]} />} />
      <Route path="/team"        component={() => <ProtectedRoute component={TeamManagement} allowedRoles={["company_admin", "ceoo", "super_admin", "manager"]} />} />
      <Route path="/employees/new"  component={() => <ProtectedRoute component={EmployeeNew} />} />
      <Route path="/employees/:id"  component={() => <ProtectedRoute component={EmployeeProfile} />} />
      <Route path="/employees"      component={() => <ProtectedRoute component={Employees} />} />
      <Route path="/payroll/:id"    component={() => <ProtectedRoute component={PayrollDetail} />} />
      <Route path="/payroll"        component={() => <ProtectedRoute component={Payroll} />} />
      <Route path="/time"           component={() => <ProtectedRoute component={Time} />} />
      <Route path="/leave"          component={() => <ProtectedRoute component={Leave} />} />
      <Route path="/benefits"       component={() => <ProtectedRoute component={Benefits} />} />
      <Route path="/onboarding"     component={() => <ProtectedRoute component={Onboarding} />} />
      <Route path="/departments"    component={() => <ProtectedRoute component={Departments} />} />
      <Route path="/recruitment"    component={() => <ProtectedRoute component={Recruitment} />} />
      <Route path="/performance"    component={() => <ProtectedRoute component={Performance} />} />
      <Route path="/reports"        component={() => <ProtectedRoute component={Reports} />} />
      <Route path="/settings"       component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/announcements"  component={() => <ProtectedRoute component={Announcements} />} />
      <Route path="/expenses"       component={() => <ProtectedRoute component={Expenses} />} />
      <Route path="/assets"         component={() => <ProtectedRoute component={Assets} />} />
      <Route path="/training"       component={() => <ProtectedRoute component={Training} />} />
      <Route path="/org-chart"      component={() => <ProtectedRoute component={OrgChart} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <PermissionsProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
            </PermissionsProvider>
          </SubscriptionProvider>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
