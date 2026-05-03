import React, { useState } from "react";
import { Link } from "wouter";
import { SkeletonTableRows } from "@/components/skeletons";
import {
  useListPayrollRuns,
  useCreatePayrollRun,
  getListPayrollRunsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "@/components/permissions-context";
import { Plus, X } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  processing: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-600",
};

function fmt(n: number | null | undefined) {
  if (n == null || n === 0) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function Payroll() {
  const qc = useQueryClient();
  const { hasPower } = usePermissions();
  const canProcess = hasPower("process_payroll");
  const { data: runs, isLoading } = useListPayrollRuns({}, { query: { queryKey: getListPayrollRunsQueryKey({}) } });
  const createMut = useCreatePayrollRun({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListPayrollRunsQueryKey({}) }) } });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", periodStart: "", periodEnd: "", payDate: "", notes: "" });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({ data: { name: form.name, periodStart: form.periodStart, periodEnd: form.periodEnd, payDate: form.payDate, notes: form.notes || undefined } }, { onSuccess: () => { setShowModal(false); setForm({ name: "", periodStart: "", periodEnd: "", payDate: "", notes: "" }); } });
  };

  const allRuns = runs ?? [];
  const draft = allRuns.filter(r => r.status === "draft");
  const completed = allRuns.filter(r => r.status === "completed");

  const inputCls = "w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Payroll Runs</h2>
          <p className="text-sm text-muted-foreground">{allRuns.length} total runs</p>
        </div>
        {canProcess && (
          <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shrink-0">
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">New Payroll Run</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div>
            <div className="h-3.5 w-24 rounded-md bg-muted animate-pulse mb-3" />
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/30">
                  <tr>{["Run Name","Period","Pay Date","Status","Action"].map(h => <th key={h} className="text-left px-5 py-3 font-medium text-muted-foreground">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border"><SkeletonTableRows rows={3} cols={5} /></tbody>
              </table>
            </div>
          </div>
          <div>
            <div className="h-3.5 w-32 rounded-md bg-muted animate-pulse mb-3" />
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/30">
                  <tr>{["Run Name","Period","Pay Date","Gross","Net","Employees","Action"].map(h => <th key={h} className="text-left px-5 py-3 font-medium text-muted-foreground">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border"><SkeletonTableRows rows={4} cols={7} /></tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {draft.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Draft Runs</h3>
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Run Name</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Period</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pay Date</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-right px-5 py-3 font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {draft.map((run) => (
                      <tr key={run.id} className="hover:bg-muted/20">
                        <td className="px-5 py-3 font-medium text-foreground">{run.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{run.periodStart} → {run.periodEnd}</td>
                        <td className="px-4 py-3 text-muted-foreground">{run.payDate}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[run.status]}`}>{run.status}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link href={`/payroll/${run.id}`} className="text-xs font-medium text-primary hover:underline">View / Process</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Completed Runs</h3>
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Run Name</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Period</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pay Date</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Gross</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Net</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Employees</th>
                      <th className="text-right px-5 py-3 font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {completed.reverse().map((run) => (
                      <tr key={run.id} className="hover:bg-muted/20">
                        <td className="px-5 py-3 font-medium text-foreground">{run.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{run.periodStart} → {run.periodEnd}</td>
                        <td className="px-4 py-3 text-muted-foreground">{run.payDate}</td>
                        <td className="px-4 py-3 text-right font-medium">{fmt(run.totalGrossPay)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-700">{fmt(run.totalNetPay)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{run.employeeCount}</td>
                        <td className="px-5 py-3 text-right">
                          <Link href={`/payroll/${run.id}`} className="text-xs font-medium text-primary hover:underline">View stubs</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {allRuns.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-white rounded-xl border border-border">
              <p className="text-sm">No payroll runs yet.</p>
              {canProcess && <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-primary hover:underline">Create the first run</button>}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && canProcess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-lg">New Payroll Run</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Run Name</label>
                <input required value={form.name} onChange={set("name")} className={inputCls} placeholder="Bi-weekly Jun 1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Period Start</label>
                  <input required type="date" value={form.periodStart} onChange={set("periodStart")} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Period End</label>
                  <input required type="date" value={form.periodEnd} onChange={set("periodEnd")} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Pay Date</label>
                <input required type="date" value={form.payDate} onChange={set("payDate")} className={inputCls} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted/50">Cancel</button>
                <button type="submit" disabled={createMut.isPending} className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  {createMut.isPending ? "Creating..." : "Create Run"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
