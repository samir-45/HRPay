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
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "@/components/ui/sonner";

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function Departments() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", budget: "" });
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const { data: depts, isLoading } = useListDepartments({ query: { queryKey: getListDepartmentsQueryKey() } });
  const createMut = useCreateDepartment({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListDepartmentsQueryKey() });
        closeModal();
        toast.success("Department created", { description: `"${form.name}" has been added.` });
      },
      onError: () => toast.error("Failed to create department"),
    },
  });
  const updateMut = useUpdateDepartment({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListDepartmentsQueryKey() });
        closeModal();
        toast.success("Department updated");
      },
      onError: () => toast.error("Failed to update department"),
    },
  });
  const deleteMut = useDeleteDepartment({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListDepartmentsQueryKey() });
        toast.success("Department deleted", { description: `"${deleteTarget?.name}" has been removed.` });
      },
      onError: () => toast.error("Failed to delete department"),
    },
  });

  const closeModal = () => { setShowModal(false); setEditId(null); setForm({ name: "", description: "", budget: "" }); };
  const openEdit = (d: any) => { setForm({ name: d.name, description: d.description ?? "", budget: d.budget ? String(d.budget) : "" }); setEditId(d.id); setShowModal(true); };

  const deptList = depts ?? [];
  const inputCls = "w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name, description: form.description, budget: form.budget ? Number(form.budget) : undefined };
    if (editId) updateMut.mutate({ id: editId, data: payload });
    else createMut.mutate({ data: payload });
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Departments</h2>
          <p className="text-sm text-muted-foreground">{deptList.length} departments</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 shrink-0">
          <Plus className="h-4 w-4" /><span className="hidden sm:inline">Add Department</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-5 space-y-4 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="size-10 rounded-lg bg-muted" />
                <div className="flex gap-1"><div className="size-7 rounded-lg bg-muted" /><div className="size-7 rounded-lg bg-muted" /></div>
              </div>
              <div className="space-y-2"><div className="h-4 w-32 rounded-md bg-muted" /><div className="h-3 w-48 rounded-md bg-muted" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/60 p-3 space-y-2"><div className="h-2.5 w-16 rounded bg-muted" /><div className="h-5 w-8 rounded bg-muted" /></div>
                <div className="rounded-lg bg-muted/60 p-3 space-y-2"><div className="h-2.5 w-16 rounded bg-muted" /><div className="h-4 w-20 rounded bg-muted" /></div>
              </div>
            </div>
          ))}
        </div>
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
                  <button
                    onClick={() => setDeleteTarget({ id: d.id, name: d.name })}
                    className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
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

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete department?"
        description={`"${deleteTarget?.name}" and all its configuration will be permanently removed. Employees in this department will become unassigned.`}
        confirmLabel="Delete Department"
        onConfirm={() => { if (deleteTarget) deleteMut.mutate({ id: deleteTarget.id }); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
