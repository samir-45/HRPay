import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, apiHeaders } from "@/components/auth-context";
import { toast } from "@/components/ui/sonner";
import { SkeletonGoalCards } from "@/components/skeletons";
import { Target, Plus, X, Star, TrendingUp, CheckCircle2, Clock, AlertCircle } from "lucide-react";

const API = "/api";

interface Goal { id: number; employeeId: number; employeeName?: string; employeeLastName?: string; title: string; description?: string; category?: string; progress: number; status: string; dueDate?: string; cycle?: string; }
interface Review { id: number; employeeId: number; employeeName?: string; employeeLastName?: string; employeePosition?: string; cycle: string; period: string; overallRating?: string; status: string; selfReview?: string; managerFeedback?: string; strengths?: string; improvements?: string; }

const statusMeta: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  active: { label: "Active", icon: Clock, color: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", icon: CheckCircle2, color: "bg-green-100 text-green-700" },
  overdue: { label: "Overdue", icon: AlertCircle, color: "bg-red-100 text-red-700" },
  pending: { label: "Pending", icon: Clock, color: "bg-yellow-100 text-yellow-700" },
  submitted: { label: "Submitted", icon: CheckCircle2, color: "bg-blue-100 text-blue-700" },
};

const LIME = "hsl(82 80% 48%)";

export default function Performance() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"goals" | "reviews">("goals");
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ employeeId: "", title: "", description: "", category: "individual", target: "", dueDate: "", cycle: "Q2 2026", progress: 0 });
  const [newReview, setNewReview] = useState({ employeeId: "", cycle: "annual", period: "2025", selfReview: "", managerFeedback: "", overallRating: "", strengths: "", improvements: "" });

  const goals = useQuery<Goal[]>({ queryKey: ["goals"], queryFn: () => fetch(`${API}/performance/goals`, { headers: apiHeaders(token) }).then(r => r.json()) });
  const reviews = useQuery<Review[]>({ queryKey: ["reviews"], queryFn: () => fetch(`${API}/performance/reviews`, { headers: apiHeaders(token) }).then(r => r.json()) });

  const createGoal = useMutation({
    mutationFn: (body: typeof newGoal) => fetch(`${API}/performance/goals`, { method: "POST", headers: apiHeaders(token), body: JSON.stringify({ ...body, employeeId: Number(body.employeeId), progress: Number(body.progress) }) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goals"] }); setShowGoalForm(false); },
    onError: () => toast.error("Failed to create goal", { description: "Please try again." }),
  });
  const createReview = useMutation({
    mutationFn: (body: typeof newReview) => fetch(`${API}/performance/reviews`, { method: "POST", headers: apiHeaders(token), body: JSON.stringify({ ...body, employeeId: Number(body.employeeId), overallRating: body.overallRating || null }) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reviews"] }); setShowReviewForm(false); },
    onError: () => toast.error("Failed to create review", { description: "Please try again." }),
  });
  const updateGoalProgress = useMutation({
    mutationFn: ({ id, progress }: { id: number; progress: number }) => fetch(`${API}/performance/goals/${id}`, { method: "PATCH", headers: apiHeaders(token), body: JSON.stringify({ progress }) }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
    onError: () => toast.error("Failed to update goal", { description: "Please try again." }),
  });

  const avgProgress = (goals.data ?? []).length ? Math.round((goals.data ?? []).reduce((s, g) => s + g.progress, 0) / (goals.data ?? []).length) : 0;
  const completedGoals = (goals.data ?? []).filter(g => g.status === "completed" || g.progress >= 100).length;
  const pendingReviews = (reviews.data ?? []).filter(r => r.status === "pending").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Performance Management</h2>
          <p className="text-sm text-muted-foreground">Goals, OKRs & Review Cycles</p>
        </div>
        <button onClick={() => tab === "goals" ? setShowGoalForm(true) : setShowReviewForm(true)} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:opacity-90" style={{ background: LIME }}>
          <Plus className="h-4 w-4" /> {tab === "goals" ? "New Goal" : "New Review"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Goals", value: (goals.data ?? []).length, icon: Target, hero: true },
          { label: "Avg Progress", value: `${avgProgress}%`, icon: TrendingUp },
          { label: "Goals Completed", value: completedGoals, icon: CheckCircle2 },
          { label: "Pending Reviews", value: pendingReviews, icon: Clock },
        ].map(({ label, value, icon: Icon, hero }) => (
          <div key={label} className="rounded-2xl p-4 shadow-sm" style={{ background: hero ? LIME : "white", border: hero ? "none" : "1px solid hsl(220 15% 91%)" }}>
            <div className={`flex size-8 items-center justify-center rounded-lg mb-2 ${hero ? "bg-black/15" : "bg-muted"}`}>
              <Icon className={`h-4 w-4 ${hero ? "text-foreground" : "text-muted-foreground"}`} />
            </div>
            <p className={`text-xs font-medium ${hero ? "text-foreground/70" : "text-muted-foreground"}`}>{label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${hero ? "text-foreground" : "text-foreground"}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
        {(["goals", "reviews"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${tab === t ? "text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`} style={tab === t ? { background: LIME } : {}}>
            {t === "goals" ? "Goals & OKRs" : "Performance Reviews"}
          </button>
        ))}
      </div>

      {/* Goals Tab */}
      {tab === "goals" && (
        <div className="space-y-3">
          {goals.isLoading ? (
            <SkeletonGoalCards count={4} />
          ) : (goals.data ?? []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-white/50 p-10 text-center">
              <Target className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No goals yet. Create the first goal to get started.</p>
            </div>
          ) : (
            (goals.data ?? []).map(goal => {
              const meta = statusMeta[goal.status] ?? statusMeta["active"];
              const Icon = meta.icon;
              return (
                <div key={goal.id} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-foreground">{goal.title}</h4>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.color}`}>
                          <Icon className="inline h-3 w-3 mr-1" />{meta.label}
                        </span>
                        {goal.category && <span className="rounded-full px-2.5 py-0.5 text-xs bg-muted text-muted-foreground capitalize">{goal.category}</span>}
                      </div>
                      {goal.employeeName && (
                        <p className="text-xs text-muted-foreground mt-1">{goal.employeeName} {goal.employeeLastName}</p>
                      )}
                      {goal.description && <p className="text-sm text-muted-foreground mt-1.5">{goal.description}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-bold text-foreground">{goal.progress}%</p>
                      {goal.dueDate && <p className="text-xs text-muted-foreground mt-0.5">Due {new Date(goal.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${goal.progress}%`, background: LIME }} />
                    </div>
                    <div className="flex gap-2 mt-2">
                      {[0, 25, 50, 75, 100].map(p => (
                        <button key={p} onClick={() => updateGoalProgress.mutate({ id: goal.id, progress: p })} className={`text-xs px-2 py-0.5 rounded-full transition-colors ${goal.progress === p ? "text-foreground font-semibold" : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"}`} style={goal.progress === p ? { background: LIME } : {}}>
                          {p}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {tab === "reviews" && (
        <div className="space-y-3">
          {reviews.isLoading ? (
            <SkeletonGoalCards count={3} />
          ) : (reviews.data ?? []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-white/50 p-10 text-center">
              <Star className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No performance reviews yet.</p>
            </div>
          ) : (
            (reviews.data ?? []).map(review => {
              const meta = statusMeta[review.status] ?? statusMeta["pending"];
              const Icon = meta.icon;
              const rating = Number(review.overallRating ?? 0);
              return (
                <div key={review.id} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-foreground">{review.employeeName} {review.employeeLastName}</h4>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.color}`}>
                          <Icon className="inline h-3 w-3 mr-1" />{meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{review.employeePosition} · {review.cycle} review · {review.period}</p>
                      {review.strengths && <p className="text-sm text-muted-foreground mt-2"><span className="font-medium text-foreground">Strengths:</span> {review.strengths}</p>}
                      {review.improvements && <p className="text-sm text-muted-foreground mt-1"><span className="font-medium text-foreground">Growth areas:</span> {review.improvements}</p>}
                    </div>
                    {rating > 0 && (
                      <div className="text-center shrink-0">
                        <p className="text-3xl font-bold text-foreground">{rating.toFixed(1)}</p>
                        <div className="flex gap-0.5 mt-1 justify-center">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`h-3 w-3 ${s <= rating ? "fill-current" : ""}`} style={{ color: s <= rating ? LIME : "hsl(220 15% 80%)" }} />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">/ 5.0</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* New Goal Modal */}
      {showGoalForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">New Goal</h3>
              <button onClick={() => setShowGoalForm(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Employee ID</label>
                <input type="number" value={newGoal.employeeId} onChange={e => setNewGoal(p => ({ ...p, employeeId: e.target.value }))} className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none" placeholder="e.g. 1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Goal Title</label>
                <input type="text" value={newGoal.title} onChange={e => setNewGoal(p => ({ ...p, title: e.target.value }))} className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none" placeholder="e.g. Launch product v2.0" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <textarea value={newGoal.description} onChange={e => setNewGoal(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <select value={newGoal.category} onChange={e => setNewGoal(p => ({ ...p, category: e.target.value }))} className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none">
                    <option value="individual">Individual</option>
                    <option value="team">Team</option>
                    <option value="company">Company</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Cycle</label>
                  <input type="text" value={newGoal.cycle} onChange={e => setNewGoal(p => ({ ...p, cycle: e.target.value }))} className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Due Date</label>
                <input type="date" value={newGoal.dueDate} onChange={e => setNewGoal(p => ({ ...p, dueDate: e.target.value }))} className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowGoalForm(false)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted">Cancel</button>
              <button onClick={() => createGoal.mutate(newGoal)} disabled={!newGoal.title || !newGoal.employeeId || createGoal.isPending} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-foreground disabled:opacity-50" style={{ background: LIME }}>
                {createGoal.isPending ? "Saving…" : "Create Goal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Review Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">New Performance Review</h3>
              <button onClick={() => setShowReviewForm(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Employee ID</label>
                  <input type="number" value={newReview.employeeId} onChange={e => setNewReview(p => ({ ...p, employeeId: e.target.value }))} className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Rating (1-5)</label>
                  <input type="number" min="1" max="5" step="0.1" value={newReview.overallRating} onChange={e => setNewReview(p => ({ ...p, overallRating: e.target.value }))} className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none" placeholder="4.5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Cycle</label>
                  <select value={newReview.cycle} onChange={e => setNewReview(p => ({ ...p, cycle: e.target.value }))} className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none">
                    <option value="annual">Annual</option>
                    <option value="half-yearly">Half-yearly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Period</label>
                  <input type="text" value={newReview.period} onChange={e => setNewReview(p => ({ ...p, period: e.target.value }))} className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none" placeholder="2025" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Strengths</label>
                <textarea value={newReview.strengths} onChange={e => setNewReview(p => ({ ...p, strengths: e.target.value }))} rows={2} className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Areas for Improvement</label>
                <textarea value={newReview.improvements} onChange={e => setNewReview(p => ({ ...p, improvements: e.target.value }))} rows={2} className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowReviewForm(false)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted">Cancel</button>
              <button onClick={() => createReview.mutate(newReview)} disabled={!newReview.employeeId || createReview.isPending} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-foreground disabled:opacity-50" style={{ background: LIME }}>
                {createReview.isPending ? "Saving…" : "Create Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
