import React, { useState } from "react";
import { SkeletonOnboardingGroups } from "@/components/skeletons";
import {
  useListOnboardingTasks,
  useCompleteOnboardingTask,
  useCreateOnboardingTask,
  useListEmployees,
  getListOnboardingTasksQueryKey,
  getListEmployeesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-context";
import { CheckCircle2, Circle, Plus, X } from "lucide-react";
import { EmployeeSearchSelect } from "@/components/employee-search-select";

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-600",
};

const CATEGORY_STYLES: Record<string, string> = {
  documentation: "bg-blue-100 text-blue-700",
  equipment: "bg-purple-100 text-purple-700",
  training: "bg-teal-100 text-teal-700",
  orientation: "bg-pink-100 text-pink-700",
  benefits: "bg-emerald-100 text-emerald-700",
};

export default function Onboarding() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isEmployee = user?.role === "employee";

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ employeeId: "", title: "", description: "", category: "documentation", dueDate: "", priority: "medium", assignedTo: "" });

  const { data: tasks, isLoading } = useListOnboardingTasks({}, { query: { queryKey: getListOnboardingTasksQueryKey({}) } });
  const { data: empData } = useListEmployees({ page: 1, limit: 100 }, {
    query: { queryKey: getListEmployeesQueryKey({ page: 1, limit: 100 }), enabled: !isEmployee },
  });

  const completeMut = useCompleteOnboardingTask({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListOnboardingTasksQueryKey({}) }) } });
  const createMut = useCreateOnboardingTask({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListOnboardingTasksQueryKey({}) });
        setShowModal(false);
        setForm({ employeeId: "", title: "", description: "", category: "documentation", dueDate: "", priority: "medium", assignedTo: "" });
      },
    },
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const taskList = tasks ?? [];

  const grouped = taskList.reduce<Record<string, { name: string; tasks: typeof taskList }>>((acc, t) => {
    const key = String(t.employeeId);
    if (!acc[key]) acc[key] = { name: t.employeeName ?? "Unknown", tasks: [] };
    acc[key].tasks.push(t);
    return acc;
  }, {});

  const inputCls = "w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Onboarding</h2>
          <p className="text-sm text-muted-foreground">{taskList.filter(t => !t.isCompleted).length} open tasks across {Object.keys(grouped).length} employees</p>
        </div>
        {!isEmployee && (
          <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Add Task
          </button>
        )}
      </div>

      {isLoading ? (
        <SkeletonOnboardingGroups count={3} />
      ) : Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-white rounded-xl border border-border">
          <p className="text-sm">No onboarding tasks yet.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([empId, { name, tasks }]) => {
            const completed = tasks.filter(t => t.isCompleted).length;
            const pct = Math.round((completed / tasks.length) * 100);
            return (
              <div key={empId} className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{completed} / {tasks.length} tasks completed</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-primary w-10 text-right">{pct}%</span>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {tasks.map((t) => (
                    <div key={t.id} className={`flex items-start gap-4 px-5 py-3.5 ${t.isCompleted ? "opacity-60" : ""}`}>
                      <button
                        onClick={() => !t.isCompleted && completeMut.mutate({ id: t.id })}
                        disabled={t.isCompleted}
                        className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary disabled:cursor-default"
                      >
                        {t.isCompleted ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${t.isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.title}</p>
                        {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {t.category && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_STYLES[t.category] ?? "bg-gray-100"}`}>{t.category}</span>}
                          {t.priority && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLES[t.priority] ?? "bg-gray-100"}`}>{t.priority}</span>}
                          {t.dueDate && <span className="text-xs text-muted-foreground">Due {t.dueDate}</span>}
                          {t.assignedTo && <span className="text-xs text-muted-foreground">Assigned to {t.assignedTo}</span>}
                        </div>
                      </div>
                      {t.completedAt && (
                        <span className="text-xs text-muted-foreground shrink-0">{new Date(t.completedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && !isEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-lg">Add Onboarding Task</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded text-muted-foreground hover:bg-muted/50"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createMut.mutate({ data: { title: form.title, description: form.description || undefined, category: form.category as "documentation" | "it_setup" | "training" | "introduction" | "compliance", priority: form.priority as "high" | "medium" | "low", assignedTo: form.assignedTo || undefined, employeeId: Number(form.employeeId), dueDate: form.dueDate || undefined } }); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Employee</label>
                <EmployeeSearchSelect
                  employees={empData?.employees ?? []}
                  value={form.employeeId}
                  onChange={v => set("employeeId")({ target: { value: v } } as React.ChangeEvent<HTMLSelectElement>)}
                  required
                />
              </div>
              <div><label className="block text-sm font-medium mb-1.5">Task Title</label><input required value={form.title} onChange={set("title")} className={inputCls} placeholder="Complete I-9 verification" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Description</label><textarea value={form.description} onChange={set("description")} className={`${inputCls} resize-none`} rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1.5">Category</label><select value={form.category} onChange={set("category")} className={inputCls}><option value="documentation">Documentation</option><option value="it_setup">IT Setup</option><option value="training">Training</option><option value="introduction">Introduction</option><option value="compliance">Compliance</option></select></div>
                <div><label className="block text-sm font-medium mb-1.5">Priority</label><select value={form.priority} onChange={set("priority")} className={inputCls}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1.5">Due Date</label><input type="date" value={form.dueDate} onChange={set("dueDate")} className={inputCls} /></div>
                <div><label className="block text-sm font-medium mb-1.5">Assigned To</label><input value={form.assignedTo} onChange={set("assignedTo")} className={inputCls} placeholder="HR Team" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted/50">Cancel</button>
                <button type="submit" disabled={createMut.isPending} className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{createMut.isPending ? "Adding..." : "Add Task"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
