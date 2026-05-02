import React, { useState } from "react";
import {
  useListDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  getListDepartmentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, X, Pencil, Trash2, Building2 } from "lucide-react";

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function Departments() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", budget: "" });

  const { data: depts, isLoading } = useListDepartments({ query: { queryKey: getListDepartmentsQueryKey() } });
  const createMut = useCreateDepartment({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListDepartmentsQueryKey() }); closeModal(); } } });
  const updateMut = useUpdateDepartment({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListDepartmentsQueryKey() }); closeModal(); } } });
  const deleteMut = useDeleteDepartment({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListDepartmentsQueryKey() }) } });

  const closeModal = () => { setShowModal(false); setEditId(null); setForm({ name: "", description: "", budget: "" }); };
  const openEdit = (d: any) => { setForm({ name: d.name, description: d.description ?? "", budget: d.budget ? String(d.budget) : "" }); setEditId(d.id); setShowModal(true); };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, budget: form.budget || undefined } as any;
    if (editId) updateMut.mutate({ id: editId, ...data });
    else createMut.mutate(data);
  };

  const deptList = depts ?? [];
  const totalHeadcount = deptList.reduce((a, d) => a + (d.headCount ?? 0), 0);
  const totalBudget = deptList.reduce((a, d) => a + (d.budget ?? 0), 0);
  const inputCls = "w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Departments</h2>
          <p className="text-sm text-muted-foreground">{deptList.length} departments · {totalHeadcount} total employees · {fmt(totalBudget)} total budget</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Department
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Loading departments...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deptList.map((d) => (
            <div key={d.id} className="bg-white rounded-xl border border-border p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(d)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => { if (confirm("Delete this department?")) deleteMut.mutate({ id: d.id }); }} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{d.name}</h3>
                {d.description && <p className="text-sm text-muted-foreground mt-0.5">{d.description}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/40 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Headcount</p>
                  <p className="text-xl font-bold text-foreground">{d.headCount ?? 0}</p>
                </div>
                <div className="rounded-lg bg-muted/40 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="text-sm font-semibold text-foreground">{fmt(d.budget)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-lg">{editId ? "Edit Department" : "Add Department"}</h3>
              <button onClick={closeModal} className="p-1.5 rounded text-muted-foreground hover:bg-muted/50"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1.5">Department Name</label><input required value={form.name} onChange={set("name")} className={inputCls} placeholder="Engineering" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Description</label><textarea value={form.description} onChange={set("description")} className={`${inputCls} resize-none`} rows={2} placeholder="Software development and infrastructure" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Budget</label><input type="number" value={form.budget} onChange={set("budget")} className={inputCls} placeholder="500000" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted/50">Cancel</button>
                <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  {createMut.isPending || updateMut.isPending ? "Saving..." : editId ? "Save Changes" : "Add Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
