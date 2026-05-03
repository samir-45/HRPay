import React, { useState } from "react";
import {
  useListBenefitPlans,
  useListBenefitEnrollments,
  useCreateBenefitPlan,
  useCreateBenefitEnrollment,
  useListEmployees,
  getListBenefitPlansQueryKey,
  getListBenefitEnrollmentsQueryKey,
  getListEmployeesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-context";
import { Plus, X, Shield } from "lucide-react";
import { EmployeeSearchSelect } from "@/components/employee-search-select";

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

const TYPE_COLORS: Record<string, string> = {
  health: "bg-blue-100 text-blue-700",
  dental: "bg-teal-100 text-teal-700",
  vision: "bg-purple-100 text-purple-700",
  life: "bg-rose-100 text-rose-700",
  disability: "bg-orange-100 text-orange-700",
  retirement: "bg-emerald-100 text-emerald-700",
  other: "bg-gray-100 text-gray-600",
};

export default function Benefits() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isEmployee = user?.role === "employee";
  const myEmployeeId = user?.employeeId;

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [planForm, setPlanForm] = useState({ name: "", type: "health", provider: "", description: "", employeeCost: "", employerCost: "" });
  const [enrollForm, setEnrollForm] = useState({ employeeId: myEmployeeId ? String(myEmployeeId) : "", planId: "" });

  const { data: plans } = useListBenefitPlans({ query: { queryKey: getListBenefitPlansQueryKey() } });
  const { data: enrollments } = useListBenefitEnrollments({}, { query: { queryKey: getListBenefitEnrollmentsQueryKey({}) } });
  const { data: empData } = useListEmployees({ page: 1, limit: 100 }, {
    query: { queryKey: getListEmployeesQueryKey({ page: 1, limit: 100 }), enabled: !isEmployee },
  });

  const createPlanMut = useCreateBenefitPlan({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListBenefitPlansQueryKey() }); setShowPlanModal(false); } } });
  const createEnrollMut = useCreateBenefitEnrollment({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListBenefitEnrollmentsQueryKey({}) }); setShowEnrollModal(false); } } });

  const setP = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setPlanForm(f => ({ ...f, [k]: e.target.value }));
  const setE = (k: string) => (e: React.ChangeEvent<HTMLSelectElement>) => setEnrollForm(f => ({ ...f, [k]: e.target.value }));

  const planList = plans ?? [];
  const enrollList = isEmployee && myEmployeeId
    ? (enrollments ?? []).filter(e => e.employeeId === myEmployeeId)
    : (enrollments ?? []);
  const inputCls = "w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Benefits</h2>
          <p className="text-sm text-muted-foreground">{planList.length} plans · {enrollList.filter(e => e.isActive).length} active enrollments</p>
        </div>
        {!isEmployee && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowEnrollModal(true)} className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted/50">
              <Plus className="h-4 w-4" /><span className="hidden sm:inline">Enroll Employee</span>
            </button>
            <button onClick={() => setShowPlanModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
              <Plus className="h-4 w-4" /><span className="hidden sm:inline">Add Plan</span>
            </button>
          </div>
        )}
      </div>

      {/* Plans */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Benefit Plans</h3>
        {planList.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm bg-white rounded-xl border border-border">No benefit plans available.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {planList.map((plan) => (
              <div key={plan.id} className="bg-white rounded-xl border border-border p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[plan.type] ?? "bg-gray-100"}`}>{plan.type}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{plan.name}</p>
                  {plan.provider && <p className="text-sm text-muted-foreground">{plan.provider}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-lg bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Employee cost</p>
                    <p className="text-sm font-semibold">{fmt(plan.employeeCost)}/mo</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Employer cost</p>
                    <p className="text-sm font-semibold">{fmt(plan.employerCost)}/mo</p>
                  </div>
                </div>
                {!isEmployee && <p className="text-xs text-muted-foreground">{plan.enrolledCount ?? 0} employees enrolled</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enrollments */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {isEmployee ? "My Enrollments" : "Recent Enrollments"}
        </h3>
        {enrollList.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm bg-white rounded-xl border border-border">
            {isEmployee ? "You are not enrolled in any benefits yet." : "No enrollments yet."}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  {!isEmployee && <th className="text-left px-5 py-3 font-medium text-muted-foreground">Employee</th>}
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Enrolled</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {enrollList.slice(0, 20).map((e) => (
                  <tr key={e.id} className="hover:bg-muted/20">
                    {!isEmployee && <td className="px-5 py-3 font-medium text-foreground">{e.employeeName}</td>}
                    <td className="px-4 py-3 text-muted-foreground">{e.planName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${e.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                        {e.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Plan Modal */}
      {showPlanModal && !isEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-lg">Add Benefit Plan</h3>
              <button onClick={() => setShowPlanModal(false)} className="p-1.5 rounded text-muted-foreground hover:bg-muted/50"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createPlanMut.mutate({ data: { ...planForm, type: planForm.type as "health" | "dental" | "vision" | "life" | "disability" | "retirement" | "other", employeeCost: planForm.employeeCost ? Number(planForm.employeeCost) : undefined, employerCost: planForm.employerCost ? Number(planForm.employerCost) : undefined } }); }} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1.5">Plan Name</label><input required value={planForm.name} onChange={setP("name")} className={inputCls} placeholder="Blue Shield PPO" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1.5">Type</label><select value={planForm.type} onChange={setP("type")} className={inputCls}><option value="health">Health</option><option value="dental">Dental</option><option value="vision">Vision</option><option value="life">Life</option><option value="disability">Disability</option><option value="retirement">Retirement</option><option value="other">Other</option></select></div>
                <div><label className="block text-sm font-medium mb-1.5">Provider</label><input value={planForm.provider} onChange={setP("provider")} className={inputCls} placeholder="Aetna" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1.5">Employee Cost/mo</label><input type="number" step="0.01" value={planForm.employeeCost} onChange={setP("employeeCost")} className={inputCls} placeholder="150.00" /></div>
                <div><label className="block text-sm font-medium mb-1.5">Employer Cost/mo</label><input type="number" step="0.01" value={planForm.employerCost} onChange={setP("employerCost")} className={inputCls} placeholder="500.00" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPlanModal(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted/50">Cancel</button>
                <button type="submit" disabled={createPlanMut.isPending} className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{createPlanMut.isPending ? "Saving..." : "Add Plan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enroll Modal */}
      {showEnrollModal && !isEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-lg">Enroll Employee</h3>
              <button onClick={() => setShowEnrollModal(false)} className="p-1.5 rounded text-muted-foreground hover:bg-muted/50"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createEnrollMut.mutate({ data: { employeeId: Number(enrollForm.employeeId), planId: Number(enrollForm.planId) } }); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Employee</label>
                <EmployeeSearchSelect
                  employees={empData?.employees ?? []}
                  value={enrollForm.employeeId}
                  onChange={v => setE("employeeId")({ target: { value: v } } as React.ChangeEvent<HTMLSelectElement>)}
                  required
                />
              </div>
              <div><label className="block text-sm font-medium mb-1.5">Benefit Plan</label><select required value={enrollForm.planId} onChange={setE("planId")} className={inputCls}><option value="">Select plan</option>{planList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEnrollModal(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted/50">Cancel</button>
                <button type="submit" disabled={createEnrollMut.isPending} className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{createEnrollMut.isPending ? "Enrolling..." : "Enroll"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
