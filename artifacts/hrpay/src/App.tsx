import React from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout";
import { AuthProvider, useAuth } from "@/components/auth-context";
import { PermissionsProvider, usePermissions } from "@/components/permissions-context";
import type { FeatureKey } from "@/components/permissions-context";
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
import Help from "@/pages/help";

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

function ProtectedRoute({
  component: Component,
  allowedRoles,
  feature,
}: {
  component: React.ComponentType;
  allowedRoles?: string[];
  feature?: FeatureKey;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const { hasFeature, isLoading: permsLoading } = usePermissions();

  // Wait for both auth and permissions to finish loading
  if (authLoading || permsLoading) return <LoadingScreen />;

  // Must be logged in
  if (!user) return <Redirect to="/login" />;

  // Role gate (hard-coded role restrictions like company_admin-only pages)
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Redirect to="/dashboard" />;

  // Feature gate: non-admin roles are checked against company permission matrix
  if (feature && !hasFeature(feature)) return <Redirect to="/dashboard" />;

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
      <Route path="/settings"    component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/help"        component={() => <ProtectedRoute component={Help} />} />

      {/* Admin-only — role gate, no feature gate */}
      <Route path="/permissions" component={() => <ProtectedRoute component={Permissions} allowedRoles={["company_admin"]} />} />
      <Route path="/team"        component={() => <ProtectedRoute component={TeamManagement} allowedRoles={["company_admin", "ceoo", "super_admin", "manager"]} feature="team" />} />

      {/* Feature-gated routes — redirect to /dashboard if role doesn't have feature */}
      <Route path="/employees/new"  component={() => <ProtectedRoute component={EmployeeNew}     feature="employees" />} />
      <Route path="/employees/:id"  component={() => <ProtectedRoute component={EmployeeProfile} feature="employees" />} />
      <Route path="/employees"      component={() => <ProtectedRoute component={Employees}       feature="employees" />} />
      <Route path="/payroll/:id"    component={() => <ProtectedRoute component={PayrollDetail}   feature="payroll" />} />
      <Route path="/payroll"        component={() => <ProtectedRoute component={Payroll}         feature="payroll" />} />
      <Route path="/time"           component={() => <ProtectedRoute component={Time}            feature="time" />} />
      <Route path="/leave"          component={() => <ProtectedRoute component={Leave}           feature="leave" />} />
      <Route path="/recruitment"    component={() => <ProtectedRoute component={Recruitment}     feature="recruitment" />} />
      <Route path="/performance"    component={() => <ProtectedRoute component={Performance}     feature="performance" />} />
      <Route path="/benefits"       component={() => <ProtectedRoute component={Benefits}        feature="benefits" />} />
      <Route path="/onboarding"     component={() => <ProtectedRoute component={Onboarding}      feature="onboarding" />} />
      <Route path="/departments"    component={() => <ProtectedRoute component={Departments}     feature="departments" />} />
      <Route path="/announcements"  component={() => <ProtectedRoute component={Announcements}   feature="announcements" />} />
      <Route path="/expenses"       component={() => <ProtectedRoute component={Expenses}        feature="expenses" />} />
      <Route path="/assets"         component={() => <ProtectedRoute component={Assets}          feature="assets" />} />
      <Route path="/training"       component={() => <ProtectedRoute component={Training}        feature="training" />} />
      <Route path="/org-chart"      component={() => <ProtectedRoute component={OrgChart}        feature="org-chart" />} />
      <Route path="/reports"        component={() => <ProtectedRoute component={Reports}         feature="reports" />} />

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
