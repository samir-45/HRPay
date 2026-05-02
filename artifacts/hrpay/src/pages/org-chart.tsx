import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth, apiHeaders } from "@/components/auth-context";
import { Users, ChevronDown, ChevronRight, Mail, MapPin, Briefcase } from "lucide-react";

const API = "/api";
const LIME = "hsl(82 80% 48%)";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  status: string;
  employmentType: string;
  departmentName?: string;
  startDate?: string;
  avatarUrl?: string;
}

interface Department {
  id: number;
  name: string;
  description?: string;
  managerName?: string;
  employeeCount?: number;
  budget?: string;
}

const DEPT_COLORS = [
  "hsl(82 80% 48%)",
  "#1a1a1a",
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#0ea5e9",
];

function EmployeeCard({ emp, compact = false }: { emp: Employee; compact?: boolean }) {
  const initials = (emp.firstName[0] ?? "") + (emp.lastName[0] ?? "");
  return (
    <div className={`flex items-center gap-2.5 rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md ${compact ? "p-2.5" : "p-3"}`}>
      <div className={`shrink-0 flex items-center justify-center rounded-xl bg-foreground text-white font-bold ${compact ? "size-7 text-[10px]" : "size-9 text-xs"}`}>
        {initials}
      </div>
      <div className="min-w-0">
        <p className={`font-semibold text-foreground truncate leading-tight ${compact ? "text-xs" : "text-sm"}`}>
          {emp.firstName} {emp.lastName}
        </p>
        <p className={`text-muted-foreground truncate ${compact ? "text-[10px]" : "text-xs"}`}>{emp.position}</p>
        {!compact && emp.email && (
          <div className="flex items-center gap-1 mt-0.5">
            <Mail className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
            <p className="text-[10px] text-muted-foreground truncate">{emp.email}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DeptBlock({ dept, employees, color }: { dept: Department; employees: Employee[]; color: string }) {
  const [expanded, setExpanded] = useState(true);
  const deptEmployees = employees.filter(e => e.departmentName === dept.name && e.status === "active");

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <button onClick={() => setExpanded(e => !e)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/20 transition-colors text-left">
        <div className="flex size-9 items-center justify-center rounded-xl shrink-0" style={{ background: color }}>
          <Briefcase className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{dept.name}</p>
          <p className="text-xs text-muted-foreground">{deptEmployees.length} employees{dept.managerName ? ` · Manager: ${dept.managerName}` : ""}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-foreground" style={{ background: color + "30", color }}>
            {deptEmployees.length}
          </span>
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border">
          {deptEmployees.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3 text-center">No active employees</p>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 pt-3">
              {deptEmployees.map(emp => (
                <EmployeeCard key={emp.id} emp={emp} compact />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrgChart() {
  const { token } = useAuth();
  const [view, setView] = useState<"dept" | "list">("dept");
  const [search, setSearch] = useState("");

  const employees = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: () => fetch(`${API}/employees`, { headers: apiHeaders(token) }).then(r => r.json()).then(d => d.employees ?? []),
  });
  const departments = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: () => fetch(`${API}/departments`, { headers: apiHeaders(token) }).then(r => r.json()),
  });

  const allEmployees = employees.data ?? [];
  const allDepts = departments.data ?? [];

  const filtered = search
    ? allEmployees.filter(e =>
        `${e.firstName} ${e.lastName} ${e.position} ${e.departmentName}`.toLowerCase().includes(search.toLowerCase())
      )
    : allEmployees;

  const active = allEmployees.filter(e => e.status === "active").length;
  const onLeave = allEmployees.filter(e => e.status === "on_leave").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Org Chart</h2>
          <p className="text-sm text-muted-foreground">Company structure and team directory</p>
        </div>
        <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
          {(["dept", "list"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-all ${view === v ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {v === "dept" ? "By Department" : "All Employees"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Employees", value: allEmployees.length, hero: true },
          { label: "Active", value: active },
          { label: "On Leave", value: onLeave },
          { label: "Departments", value: allDepts.length },
        ].map(({ label, value, hero }) => (
          <div key={label} className="rounded-2xl p-4 shadow-sm" style={{ background: hero ? LIME : "white", border: hero ? "none" : "1px solid hsl(220 15% 91%)" }}>
            <p className={`text-xs font-medium mb-1 ${hero ? "text-foreground/70" : "text-muted-foreground"}`}>{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search employees by name, position, or department…"
          className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm pl-9 focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": LIME } as React.CSSProperties}
        />
        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {/* Department view */}
      {view === "dept" && !search && (
        employees.isLoading || departments.isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading…</div>
        ) : (
          <div className="space-y-4">
            {allDepts.map((dept, i) => (
              <DeptBlock key={dept.id} dept={dept} employees={allEmployees} color={DEPT_COLORS[i % DEPT_COLORS.length]} />
            ))}
          </div>
        )
      )}

      {/* List / Search view */}
      {(view === "list" || search) && (
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Employee", "Position", "Department", "Email", "Type", "Status"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.isLoading ? (
                <tr><td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">No employees found</td></tr>
              ) : filtered.map(emp => (
                <tr key={emp.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-xl bg-foreground flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {(emp.firstName[0] ?? "") + (emp.lastName[0] ?? "")}
                      </div>
                      <span className="font-medium">{emp.firstName} {emp.lastName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{emp.position}</td>
                  <td className="py-3 px-4">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{emp.departmentName ?? "—"}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{emp.email}</td>
                  <td className="py-3 px-4"><span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{emp.employmentType?.replace("_", " ")}</span></td>
                  <td className="py-3 px-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${emp.status === "active" ? "text-foreground" : "bg-muted text-muted-foreground"}`}
                      style={emp.status === "active" ? { background: LIME } : {}}>
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
