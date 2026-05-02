import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout";
import NotFound from "@/pages/not-found";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/employees/new" component={EmployeeNew} />
        <Route path="/employees/:id" component={EmployeeProfile} />
        <Route path="/employees" component={Employees} />
        <Route path="/payroll/:id" component={PayrollDetail} />
        <Route path="/payroll" component={Payroll} />
        <Route path="/time" component={Time} />
        <Route path="/leave" component={Leave} />
        <Route path="/benefits" component={Benefits} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/departments" component={Departments} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
