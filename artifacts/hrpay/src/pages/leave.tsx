import React, { useState } from "react";
import {
  useListLeaveRequests,
  useApproveLeaveRequest,
  useRejectLeaveRequest,
  useCreateLeaveRequest,
  useListEmployees,
  getListLeaveRequestsQueryKey,
  getListEmployeesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X, Plus, CalendarDays } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-600",
  cancelled: "bg-gray-100 text-gray-600",
};

const TYPE_COLORS: Record<string, string> = {
  vacation: "bg-blue-100 text-blue-700",
  sick: "bg-rose-100 text-rose-700",
  personal: "bg-purple-100 text-purple-700",
  maternity: "bg-pink-100 text-pink-700",
  paternity: "bg-cyan-100 text-cyan-700",
  unpaid: "bg-gray-100 text-gray-600",
};

export default function Leave() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ employeeId: "", type: "vacation", startDate: "", endDate: "", reason: "" });

  const params = { ...(status && { status }), ...(type && { type }) };
  const { data: requests, isLoading } = useListLeaveRequests(params, { query: { queryKey: getListLeaveRequestsQueryKey(params) } });
  const { data: empData } = useListEmployees({ page: 1, limit: 100 }, { query: { queryKey: getListEmployeesQueryKey({ page: 1, limit: 100 }) } });

  const approveMut = useApproveLeaveRequest({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListLeaveRequestsQueryKey({}) }) } });
  const rejectMut = useRejectLeaveRequest({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListLeaveRequestsQueryKey({}) }) } });
  const createMut = useCreateLeaveRequest({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListLeaveRequestsQueryKey({}) });
        setShowModal(false);
        setForm({ employeeId: "", type: "vacation", startDate: "", endDate: "", reason: "" });
      },
    },
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const reqList = requests ?? [];
  const pending = reqList.filter(r => r.status === "pending");
  const inputCls = "w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Leave Management</h2>
          <p className="text-sm text-muted-foreground">{reqList.length} requests · {pending.length} pending</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New Request
        </button>
      </div>

      {pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-3"><CalendarDays className="inline h-4 w-4 mr-1" />{pending.length} requests awaiting approval</p>
          <div className="space-y-2">
            {pending.map((r) => (
              <div key={r.id} className="flex items-center gap-3 bg-white rounded-lg border border-amber-200 px-4 py-2.5 text-sm">
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{r.employeeName}</span>
                  <span className="mx-2 text-muted-foreground">·</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[r.type] ?? "bg-gray-100"}`}>{r.type}</span>
                  <span className="ml-2 text-muted-foreground">{r.startDate} → {r.endDate} ({r.days} days)</span>
                </div>
                <button onClick={() => approveMut.mutate({ id: r.id })} className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 border border-emerald-200"><Check className="h-3.5 w-3.5" /></button>
                <button onClick={() => rejectMut.mutate({ id: r.id })} className="p-1.5 rounded text-red-500 hover:bg-red-50 border border-red-200"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={type} onChange={e => setType(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">All Types</option>
          <option value="vacation">Vacation</option>
          <option value="sick">Sick</option>
          <option value="personal">Personal</option>
          <option value="maternity">Maternity</option>
          <option value="paternity">Paternity</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Loading...</div>
      ) : reqList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-white rounded-xl border border-border">
          <p className="text-sm">No leave requests found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Employee</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Period</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Days</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reqList.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="px-5 py-3 font-medium text-foreground">{r.employeeName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[r.type] ?? "bg-gray-100"}`}>{r.type}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.startDate} → {r.endDate}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{r.days ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[r.status] ?? "bg-gray-100"}`}>{r.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {r.status === "pending" && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => approveMut.mutate({ id: r.id })} className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"><Check className="h-3.5 w-3.5" /> Approve</button>
                        <button onClick={() => rejectMut.mutate({ id: r.id })} className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600"><X className="h-3.5 w-3.5" /> Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-lg">New Leave Request</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded text-muted-foreground hover:bg-muted/50"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createMut.mutate({ ...form, employeeId: Number(form.employeeId) } as any); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Employee</label>
                <select required value={form.employeeId} onChange={set("employeeId")} className={inputCls}>
                  <option value="">Select employee</option>
                  {(empData?.employees ?? []).map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Leave Type</label>
                <select required value={form.type} onChange={set("type")} className={inputCls}>
                  <option value="vacation">Vacation</option>
                  <option value="sick">Sick</option>
                  <option value="personal">Personal</option>
                  <option value="maternity">Maternity</option>
                  <option value="paternity">Paternity</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Start Date</label>
                  <input required type="date" value={form.startDate} onChange={set("startDate")} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">End Date</label>
                  <input required type="date" value={form.endDate} onChange={set("endDate")} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Reason</label>
                <textarea value={form.reason} onChange={set("reason")} className={`${inputCls} resize-none`} rows={2} placeholder="Optional reason..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted/50">Cancel</button>
                <button type="submit" disabled={createMut.isPending} className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  {createMut.isPending ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
