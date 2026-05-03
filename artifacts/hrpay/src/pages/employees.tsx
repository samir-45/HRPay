import React, { useState } from "react";
import { Link } from "wouter";
import { SkeletonEmployeeTableRows } from "@/components/skeletons";
import { useListEmployees, useListDepartments, useDeleteEmployee, getListEmployeesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-context";
import { Search, Plus, LayoutGrid, List, Trash2, Eye } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "@/components/ui/sonner";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-gray-100 text-gray-600",
  on_leave: "bg-amber-100 text-amber-700",
  terminated: "bg-red-100 text-red-600",
};

const TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contractor: "Contractor",
  intern: "Intern",
};

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const hue = (name.charCodeAt(0) * 37) % 360;
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white" style={{ background: `hsl(${hue} 60% 45%)` }}>
      {initials}
    </div>
  );
}

export default function Employees() {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("");
  const [status, setStatus] = useState("");
  const [view, setView] = useState<"table" | "grid">("table");
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const qc = useQueryClient();
  const { user } = useAuth();
  const isEmployee = user?.role === "employee";

  const params = { page: 1, limit: 100, ...(search && { search }), ...(dept && { department: dept }), ...(status && { status: status as "active" | "inactive" | "on_leave" | "terminated" }) };
  const { data, isLoading } = useListEmployees(params, { query: { queryKey: getListEmployeesQueryKey(params) } });
  const { data: depts } = useListDepartments();
  const deleteMut = useDeleteEmployee({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListEmployeesQueryKey({}) });
        toast.success("Employee removed", { description: `${deleteTarget?.name ?? "Employee"} has been deleted.` });
      },
      onError: () => toast.error("Failed to delete employee", { description: "Please try again." }),
    },
  });

  const employees = data?.employees ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Employee Directory</h2>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} employees</p>
        </div>
        {!isEmployee && (
          <Link href="/employees/new" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shrink-0">
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Add Employee</span>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees..."
            className="pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 w-full"
          />
        </div>
        <select value={dept} onChange={(e) => setDept(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">All Departments</option>
          {(depts ?? []).map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="on_leave">On Leave</option>
          <option value="terminated">Terminated</option>
        </select>
        <div className="flex gap-1 border border-border rounded-lg p-1 bg-white ml-auto shrink-0">
          <button onClick={() => setView("table")} className={`p-1.5 rounded ${view === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}><List className="h-4 w-4" /></button>
          <button onClick={() => setView("grid")} className={`p-1.5 rounded ${view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}><LayoutGrid className="h-4 w-4" /></button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                {["Employee","Department","Type","Status","Start Date","Actions"].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <SkeletonEmployeeTableRows rows={7} />
            </tbody>
          </table>
        </div>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <p className="text-sm">No employees found.</p>
          {!isEmployee && <Link href="/employees/new" className="mt-3 text-sm text-primary hover:underline">Add the first employee</Link>}
        </div>
      ) : view === "table" ? (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Employee</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Department</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Start Date</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${emp.firstName} ${emp.lastName}`} />
                      <div>
                        <p className="font-medium text-foreground">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-muted-foreground">{emp.position}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.departmentName ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{TYPE_LABELS[emp.employmentType] ?? emp.employmentType}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[emp.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {emp.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.startDate}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/employees/${emp.id}`} className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                        <Eye className="h-4 w-4" />
                      </Link>
                      {!isEmployee && (
                        <button
                          onClick={() => setDeleteTarget({ id: emp.id, name: `${emp.firstName} ${emp.lastName}` })}
                          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {employees.map((emp) => (
            <div key={emp.id} className="bg-white rounded-xl border border-border p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <Avatar name={`${emp.firstName} ${emp.lastName}`} />
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{emp.firstName} {emp.lastName}</p>
                  <p className="text-xs text-muted-foreground truncate">{emp.position}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{emp.departmentName ?? "—"}</span>
                <span className={`px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[emp.status] ?? "bg-gray-100"}`}>{emp.status.replace("_", " ")}</span>
              </div>
              <Link href={`/employees/${emp.id}`} className="mt-auto text-xs text-primary font-medium hover:underline">View profile →</Link>
            </div>
          ))}
        </div>
      )}

      {!isEmployee && (
        <ConfirmDialog
          open={deleteTarget !== null}
          title="Delete employee?"
          description={`${deleteTarget?.name ?? "This employee"} will be permanently removed from the system. This action cannot be undone.`}
          confirmLabel="Delete Employee"
          onConfirm={() => { if (deleteTarget) deleteMut.mutate({ id: deleteTarget.id }); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
