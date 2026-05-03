import React, { useState } from "react";
import { SkeletonTableRows } from "@/components/skeletons";
import {
  useListTimeEntries,
  useApproveTimeEntry,
  useCreateTimeEntry,
  useListEmployees,
  getListTimeEntriesQueryKey,
  getListEmployeesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-context";
import { usePermissions } from "@/components/permissions-context";
import { Check, Plus, X, Clock } from "lucide-react";
import { EmployeeSearchSelect } from "@/components/employee-search-select";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-600",
};

export default function Time() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { hasPower } = usePermissions();
  const isEmployee = user?.role === "employee";
  const canApproveTime = hasPower("approve_time");
  const myEmployeeId = user?.employeeId;

  const [status, setStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    employeeId: myEmployeeId ? String(myEmployeeId) : "",
    date: new Date().toISOString().split("T")[0],
    clockIn: "",
    clockOut: "",
    hoursWorked: "",
    notes: "",
  });

  const baseParams = {
    limit: 100,
    ...(isEmployee && myEmployeeId ? { employeeId: myEmployeeId } : {}),
    ...(status && { status: status as "pending" | "approved" | "rejected" }),
  };
  const { data: entries, isLoading } = useListTimeEntries(baseParams, { query: { queryKey: getListTimeEntriesQueryKey(baseParams) } });
  const { data: empData } = useListEmployees({ page: 1, limit: 100 }, {
    query: { queryKey: getListEmployeesQueryKey({ page: 1, limit: 100 }), enabled: !isEmployee },
  });

  const approveMut = useApproveTimeEntry({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListTimeEntriesQueryKey({}) }) } });
  const createMut = useCreateTimeEntry({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListTimeEntriesQueryKey({}) });
        setShowModal(false);
        setForm({ employeeId: myEmployeeId ? String(myEmployeeId) : "", date: new Date().toISOString().split("T")[0], clockIn: "", clockOut: "", hoursWorked: "", notes: "" });
      },
    },
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const entryList = entries ?? [];
  const pending = entryList.filter(e => e.status === "pending");
  const totalHours = entryList.reduce((a, e) => a + (e.hoursWorked ?? 0), 0);
  const totalOT = entryList.reduce((a, e) => a + (e.overtimeHours ?? 0), 0);
  const inputCls = "w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Time & Attendance</h2>
          <p className="text-sm text-muted-foreground">{entryList.length} entries · {totalHours.toFixed(1)} hrs · {totalOT.toFixed(1)} OT</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 shrink-0">
          <Plus className="h-4 w-4" /><span className="hidden sm:inline">Log Time</span>
        </button>
      </div>

      {canApproveTime && pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-2"><Clock className="inline h-4 w-4 mr-1" />{pending.length} pending entries need approval</p>
          <div className="flex flex-wrap gap-2">
            {pending.map((e) => (
              <div key={e.id} className="flex items-center gap-2 bg-white rounded-lg border border-amber-200 px-3 py-1.5 text-sm">
                <span className="font-medium">{e.employeeName}</span>
                <span className="text-muted-foreground">{e.date} · {e.hoursWorked}h</span>
                <button onClick={() => approveMut.mutate({ id: e.id })} className="p-1 rounded text-emerald-600 hover:bg-emerald-50">
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 items-center">
        <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm min-w-[520px]">
            <thead className="border-b border-border bg-muted/30">
              <tr>{["Employee","Date","Hours","Overtime","Status","Action"].map(h => <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border"><SkeletonTableRows rows={6} cols={6} /></tbody>
          </table>
        </div>
      ) : entryList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-white rounded-xl border border-border">
          <p className="text-sm">{isEmployee ? "You have no time entries yet." : "No time entries found."}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                {!isEmployee && <th className="text-left px-5 py-3 font-medium text-muted-foreground">Employee</th>}
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Hours</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Overtime</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                {canApproveTime && <th className="text-right px-5 py-3 font-medium text-muted-foreground">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entryList.map((e) => (
                <tr key={e.id} className="hover:bg-muted/20">
                  {!isEmployee && <td className="px-5 py-3 font-medium text-foreground">{e.employeeName}</td>}
                  <td className="px-4 py-3 text-muted-foreground">{e.date}</td>
                  <td className="px-4 py-3 text-right font-medium">{e.hoursWorked ?? "—"}h</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{e.overtimeHours ?? 0}h</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[e.status]}`}>{e.status}</span>
                  </td>
                  {canApproveTime && (
                    <td className="px-5 py-3 text-right">
                      {e.status === "pending" && (
                        <button onClick={() => approveMut.mutate({ id: e.id })} className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700">
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-lg">Log Time Entry</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded text-muted-foreground hover:bg-muted/50"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createMut.mutate({ data: { date: form.date, clockIn: form.clockIn, clockOut: form.clockOut || undefined, notes: form.notes || undefined, employeeId: Number(form.employeeId) } }); }} className="space-y-4">
              {!isEmployee && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Employee</label>
                  <EmployeeSearchSelect
                    employees={empData?.employees ?? []}
                    value={form.employeeId}
                    onChange={v => set("employeeId")({ target: { value: v } } as React.ChangeEvent<HTMLSelectElement>)}
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1.5">Date</label>
                <input required type="date" value={form.date} onChange={set("date")} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Clock In</label>
                  <input type="datetime-local" value={form.clockIn} onChange={set("clockIn")} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Clock Out</label>
                  <input type="datetime-local" value={form.clockOut} onChange={set("clockOut")} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Hours (manual override)</label>
                <input type="number" step="0.5" value={form.hoursWorked} onChange={set("hoursWorked")} className={inputCls} placeholder="8.0" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted/50">Cancel</button>
                <button type="submit" disabled={!form.employeeId || createMut.isPending} className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  {createMut.isPending ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
