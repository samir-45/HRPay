import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, apiHeaders } from "@/components/auth-context";
import { usePermissions } from "@/components/permissions-context";
import { toast } from "@/components/ui/sonner";
import { SkeletonTableRows } from "@/components/skeletons";
import {
  Receipt, Plus, CheckCircle, XCircle, Clock, DollarSign,
  X, TrendingUp,
} from "lucide-react";
import { EmployeeSearchSelect } from "@/components/employee-search-select";

const API = "/api";
const LIME = "hsl(82 80% 48%)";

const CATEGORIES = ["travel", "meals", "office_supplies", "software", "hardware", "training", "marketing", "utilities", "other"];
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
  approved: { bg: "bg-lime-100", text: "text-lime-700" },
  rejected: { bg: "bg-red-100", text: "text-red-700" },
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

interface Expense {
  id: number;
  employeeId: number;
  firstName?: string;
  lastName?: string;
  title: string;
  category: string;
  amount: string;
  currency: string;
  expenseDate: string;
  description?: string;
  receiptUrl?: string;
  status: string;
  reviewedBy?: string;
  reviewNotes?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

interface Employee { id: number; firstName: string; lastName: string; }

export default function Expenses() {
  const { token, user } = useAuth();
  const { hasPower } = usePermissions();
  const isEmployee = user?.role === "employee";
  const canApproveExpenses = hasPower("approve_expenses");
  const myEmployeeId = user?.employeeId;

  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<Expense | null>(null);
  const [form, setForm] = useState({
    employeeId: myEmployeeId ? String(myEmployeeId) : "",
    title: "",
    category: "travel",
    amount: "",
    expenseDate: new Date().toISOString().split("T")[0],
    description: "",
  });

  const expenses = useQuery<Expense[]>({
    queryKey: ["expenses"],
    queryFn: () => fetch(`${API}/expenses`, { headers: apiHeaders(token) }).then(r => r.json()),
  });
  const employees = useQuery<Employee[]>({
    queryKey: ["employees-short"],
    queryFn: () => fetch(`${API}/employees`, { headers: apiHeaders(token) }).then(r => r.json()),
    enabled: !isEmployee,
  });

  const submit = useMutation({
    mutationFn: () => fetch(`${API}/expenses`, {
      method: "POST", headers: apiHeaders(token),
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    }).then(r => r.json()),
    onSuccess: () => {
      toast.success("Expense submitted successfully");
      qc.invalidateQueries({ queryKey: ["expenses"] });
      setShowForm(false);
      setForm({ employeeId: myEmployeeId ? String(myEmployeeId) : "", title: "", category: "travel", amount: "", expenseDate: new Date().toISOString().split("T")[0], description: "" });
    },
    onError: () => toast.error("Failed to submit expense", { description: "Please check your input and try again." }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, reviewNotes }: { id: number; status: string; reviewNotes?: string }) =>
      fetch(`${API}/expenses/${id}/status`, { method: "PATCH", headers: apiHeaders(token), body: JSON.stringify({ status, reviewNotes, reviewedBy: user?.name ?? "Admin" }) }).then(r => r.json()),
    onSuccess: () => { toast.success("Expense status updated successfully"); qc.invalidateQueries({ queryKey: ["expenses"] }); setSelected(null); },
    onError: () => toast.error("Failed to update expense status", { description: "Please try again." }),
  });

  const allExpenses = expenses.data ?? [];
  const filteredByRole = isEmployee && myEmployeeId
    ? allExpenses.filter(e => e.employeeId === myEmployeeId)
    : allExpenses;
  const list = filteredByRole.filter(e => filterStatus === "all" || e.status === filterStatus);
  const total = filteredByRole.reduce((s, e) => s + Number(e.amount), 0);
  const pending = filteredByRole.filter(e => e.status === "pending").reduce((s, e) => s + Number(e.amount), 0);
  const approved = filteredByRole.filter(e => e.status === "approved").reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Expenses & Reimbursements</h2>
          <p className="text-sm text-muted-foreground">
            {isEmployee ? "Track your expense claims" : "Track and approve employee expense claims"}
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground hover:opacity-90 transition-all" style={{ background: LIME }}>
          <Plus className="h-4 w-4" /> {isEmployee ? "Submit Claim" : "New Claim"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: isEmployee ? "My Total Claims" : "Total Claims", value: fmt(total), icon: DollarSign, hero: true },
          { label: "Pending Approval", value: fmt(pending), icon: Clock },
          { label: "Approved", value: fmt(approved), icon: TrendingUp },
        ].map(({ label, value, icon: Icon, hero }) => (
          <div key={label} className="rounded-2xl p-4 shadow-sm" style={{ background: hero ? LIME : "white", border: hero ? "none" : "1px solid hsl(220 15% 91%)" }}>
            <div className={`flex size-8 items-center justify-center rounded-lg mb-2 ${hero ? "bg-black/15" : "bg-muted"}`}>
              <Icon className={`h-4 w-4 ${hero ? "text-foreground" : "text-muted-foreground"}`} />
            </div>
            <p className={`text-xs font-medium ${hero ? "text-foreground/70" : "text-muted-foreground"}`}>{label}</p>
            <p className="text-xl font-bold mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 rounded-xl bg-muted/50 p-1 w-fit">
        {["all", "pending", "approved", "rejected"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all capitalize ${filterStatus === s ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Claims table */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {(canApproveExpenses ? ["Employee", "Title", "Category", "Amount", "Date", "Status", "Actions"] : ["Title", "Category", "Amount", "Date", "Status"]).map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {expenses.isLoading ? (
              <SkeletonTableRows rows={6} cols={canApproveExpenses ? 7 : 5} />
            ) : list.length === 0 ? (
              <tr><td colSpan={canApproveExpenses ? 7 : 5} className="py-12 text-center text-muted-foreground text-sm">
                {isEmployee ? "You have no expense claims yet." : "No expense claims found"}
              </td></tr>
            ) : list.map(expense => {
              const sc = STATUS_COLORS[expense.status] ?? STATUS_COLORS.pending;
              return (
                <tr key={expense.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  {canApproveExpenses && <td className="py-3 px-4 font-medium">{expense.firstName} {expense.lastName}</td>}
                  <td className="py-3 px-4">{expense.title}</td>
                  <td className="py-3 px-4"><span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{expense.category.replace("_", " ")}</span></td>
                  <td className="py-3 px-4 font-semibold">{fmt(Number(expense.amount))}</td>
                  <td className="py-3 px-4 text-muted-foreground">{expense.expenseDate}</td>
                  <td className="py-3 px-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${sc.bg} ${sc.text}`}>{expense.status}</span>
                  </td>
                  {canApproveExpenses && (
                    <td className="py-3 px-4">
                      <div className="flex gap-1.5">
                        {expense.status === "pending" && (
                          <>
                            <button onClick={() => updateStatus.mutate({ id: expense.id, status: "approved" })} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-lime-700 bg-lime-100 hover:bg-lime-200 transition-colors">
                              <CheckCircle className="h-3 w-3" /> Approve
                            </button>
                            <button onClick={() => setSelected(expense)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 transition-colors">
                              <XCircle className="h-3 w-3" /> Reject
                            </button>
                          </>
                        )}
                        {expense.status !== "pending" && (
                          <span className="text-xs text-muted-foreground">
                            {expense.reviewedAt ? new Date(expense.reviewedAt).toLocaleDateString() : "—"}
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Submit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-foreground">Submit Expense Claim</h3>
              <button onClick={() => setShowForm(false)} className="rounded-xl p-1.5 hover:bg-muted transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              {!isEmployee && (
                <div>
                  <label className="text-sm font-medium block mb-1.5">Employee</label>
                  <EmployeeSearchSelect
                    employees={employees.data ?? []}
                    value={form.employeeId}
                    onChange={v => setForm(p => ({ ...p, employeeId: v }))}
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium block mb-1.5">Title</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Flight to NYC" className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1.5">Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Amount (USD)</label>
                  <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Expense Date</label>
                <input type="date" value={form.expenseDate} onChange={e => setForm(p => ({ ...p, expenseDate: e.target.value }))} className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Description (optional)</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Additional details…" className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm resize-none" />
              </div>
            </div>
            <div className="flex gap-2.5 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              <button onClick={() => submit.mutate()} disabled={!form.employeeId || !form.title || !form.amount || submit.isPending} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-foreground disabled:opacity-50 transition-all" style={{ background: LIME }}>
                {submit.isPending ? "Submitting…" : "Submit Claim"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {selected && canApproveExpenses && (
        <RejectModal
          expense={selected}
          onClose={() => setSelected(null)}
          onReject={(notes) => updateStatus.mutate({ id: selected.id, status: "rejected", reviewNotes: notes })}
        />
      )}
    </div>
  );
}

function RejectModal({ expense, onClose, onReject }: { expense: Expense; onClose: () => void; onReject: (notes: string) => void }) {
  const [notes, setNotes] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 mx-4">
        <h3 className="font-bold text-foreground mb-1">Reject Expense Claim</h3>
        <p className="text-sm text-muted-foreground mb-4">"{expense.title}" — {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(expense.amount))}</p>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Reason for rejection (optional)…" className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm resize-none mb-4" />
        <div className="flex gap-2.5">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
          <button onClick={() => onReject(notes)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors">Reject</button>
        </div>
      </div>
    </div>
  );
}
