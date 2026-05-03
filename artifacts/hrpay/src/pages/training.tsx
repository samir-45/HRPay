import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useListEmployees, getListEmployeesQueryKey } from "@workspace/api-client-react";
import { useAuth, apiHeaders } from "@/components/auth-context";
import { SkeletonCourseCards, SkeletonTableRows } from "@/components/skeletons";
import { GraduationCap, Plus, X, BookOpen, Clock, Users, CheckCircle, PlayCircle } from "lucide-react";

const API = "/api";
const LIME = "hsl(82 80% 48%)";

const CATEGORIES = ["compliance", "technical", "leadership", "soft_skills", "onboarding", "safety", "product", "general"];
const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  enrolled: { label: "Enrolled", bg: "bg-blue-100", text: "text-blue-700" },
  in_progress: { label: "In Progress", bg: "bg-yellow-100", text: "text-yellow-700" },
  completed: { label: "Completed", bg: "bg-lime-100", text: "text-lime-700" },
  dropped: { label: "Dropped", bg: "bg-gray-100", text: "text-gray-500" },
};

interface Course {
  id: number;
  title: string;
  description?: string;
  category: string;
  durationHours?: string;
  instructor?: string;
  provider?: string;
  isRequired: boolean;
  status: string;
}

interface Enrollment {
  id: number;
  courseId: number;
  courseTitle?: string;
  courseCategory?: string;
  employeeId: number;
  firstName?: string;
  lastName?: string;
  status: string;
  progress: number;
  score?: string;
  dueDate?: string;
  completedAt?: string;
}

export default function Training() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"courses" | "enrollments">("courses");
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({ title: "", description: "", category: "general", durationHours: "", instructor: "", provider: "", isRequired: false });
  const [enrollForm, setEnrollForm] = useState({ courseId: "", employeeId: "", dueDate: "" });

  const courses = useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: () => fetch(`${API}/training/courses`, { headers: apiHeaders(token) }).then(r => r.json()),
  });
  const enrollments = useQuery<Enrollment[]>({
    queryKey: ["enrollments"],
    queryFn: () => fetch(`${API}/training/enrollments`, { headers: apiHeaders(token) }).then(r => r.json()),
  });
  const { data: empData } = useListEmployees({ page: 1, limit: 100 }, { query: { queryKey: getListEmployeesQueryKey({ page: 1, limit: 100 }) } });

  const createCourse = useMutation({
    mutationFn: () => fetch(`${API}/training/courses`, { method: "POST", headers: apiHeaders(token), body: JSON.stringify(courseForm) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["courses"] }); setShowCourseForm(false); setCourseForm({ title: "", description: "", category: "general", durationHours: "", instructor: "", provider: "", isRequired: false }); },
  });

  const createEnrollment = useMutation({
    mutationFn: () => fetch(`${API}/training/enrollments`, { method: "POST", headers: apiHeaders(token), body: JSON.stringify(enrollForm) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["enrollments"] }); setShowEnrollForm(false); setEnrollForm({ courseId: "", employeeId: "", dueDate: "" }); },
  });

  const updateEnrollment = useMutation({
    mutationFn: ({ id, status, progress }: { id: number; status?: string; progress?: number }) =>
      fetch(`${API}/training/enrollments/${id}`, { method: "PATCH", headers: apiHeaders(token), body: JSON.stringify({ status, progress }) }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["enrollments"] }),
  });

  const completionRate = enrollments.data
    ? Math.round(((enrollments.data.filter(e => e.status === "completed").length) / Math.max(enrollments.data.length, 1)) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Training & Development</h2>
          <p className="text-sm text-muted-foreground">Manage courses, enrollments and learning progress</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowEnrollForm(true)} className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
            <Users className="h-4 w-4" /> Enroll
          </button>
          <button onClick={() => setShowCourseForm(true)} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground hover:opacity-90 transition-all" style={{ background: LIME }}>
            <Plus className="h-4 w-4" /> New Course
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Courses", value: courses.data?.length ?? 0, hero: true },
          { label: "Total Enrollments", value: enrollments.data?.length ?? 0 },
          { label: "Completed", value: enrollments.data?.filter(e => e.status === "completed").length ?? 0 },
          { label: "Completion Rate", value: `${completionRate}%` },
        ].map(({ label, value, hero }) => (
          <div key={label} className="rounded-2xl p-4 shadow-sm" style={{ background: hero ? LIME : "white", border: hero ? "none" : "1px solid hsl(220 15% 91%)" }}>
            <p className={`text-xs font-medium mb-1 ${hero ? "text-foreground/70" : "text-muted-foreground"}`}>{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1 w-fit">
        {(["courses", "enrollments"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-all capitalize ${tab === t ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{t}</button>
        ))}
      </div>

      {/* Course Library */}
      {tab === "courses" && (
        courses.isLoading ? <SkeletonCourseCards count={6} /> :
        (courses.data ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
            <GraduationCap className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No courses yet</p>
            <p className="text-xs text-muted-foreground">Add your first course to start training employees</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(courses.data ?? []).map(course => {
              const courseEnrollments = (enrollments.data ?? []).filter(e => e.courseId === course.id);
              const completed = courseEnrollments.filter(e => e.status === "completed").length;
              return (
                <div key={course.id} className="rounded-2xl border border-border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex size-9 items-center justify-center rounded-xl shrink-0" style={{ background: LIME }}>
                      <BookOpen className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="flex gap-1.5">
                      {course.isRequired && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">Required</span>}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${course.status === "active" ? "bg-lime-100 text-lime-700" : "bg-gray-100 text-gray-500"}`}>{course.status}</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1 leading-snug">{course.title}</h3>
                  {course.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{course.description}</p>}
                  <div className="space-y-1 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1.5"><span className="capitalize rounded-full bg-muted px-2 py-0.5">{course.category.replace("_", " ")}</span></div>
                    {course.durationHours && <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {course.durationHours}h</div>}
                    {course.instructor && <div className="flex items-center gap-1.5"><Users className="h-3 w-3" /> {course.instructor}{course.provider ? ` · ${course.provider}` : ""}</div>}
                  </div>
                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{completed}</span>/{courseEnrollments.length} completed
                    </div>
                    <button onClick={() => setSelectedCourse(course)} className="rounded-lg px-2.5 py-1 text-xs font-medium border border-border hover:bg-muted transition-colors">View</button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Enrollments Table */}
      {tab === "enrollments" && (
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Employee", "Course", "Category", "Progress", "Status", "Due Date", "Actions"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enrollments.isLoading ? (
                <SkeletonTableRows rows={5} cols={7} />
              ) : (enrollments.data ?? []).length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">No enrollments yet</td></tr>
              ) : (enrollments.data ?? []).map(enrollment => {
                const ss = STATUS_LABELS[enrollment.status] ?? STATUS_LABELS.enrolled;
                return (
                  <tr key={enrollment.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-medium">{enrollment.firstName} {enrollment.lastName}</td>
                    <td className="py-3 px-4">{enrollment.courseTitle}</td>
                    <td className="py-3 px-4"><span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{(enrollment.courseCategory ?? "").replace("_", " ")}</span></td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden" style={{ width: 60 }}>
                          <div className="h-full rounded-full" style={{ width: `${enrollment.progress ?? 0}%`, background: LIME }} />
                        </div>
                        <span className="text-xs font-medium">{enrollment.progress ?? 0}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ss.bg} ${ss.text}`}>{ss.label}</span></td>
                    <td className="py-3 px-4 text-muted-foreground">{enrollment.dueDate ?? "—"}</td>
                    <td className="py-3 px-4">
                      {enrollment.status !== "completed" && enrollment.status !== "dropped" && (
                        <div className="flex gap-1.5">
                          <button onClick={() => updateEnrollment.mutate({ id: enrollment.id, progress: Math.min((enrollment.progress ?? 0) + 20, 100), status: (enrollment.progress ?? 0) >= 80 ? "completed" : "in_progress" })} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium bg-muted hover:bg-muted/70 transition-colors">
                            <PlayCircle className="h-3 w-3" /> Progress
                          </button>
                          <button onClick={() => updateEnrollment.mutate({ id: enrollment.id, status: "completed", progress: 100 })} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium bg-lime-100 text-lime-700 hover:bg-lime-200 transition-colors">
                            <CheckCircle className="h-3 w-3" /> Complete
                          </button>
                        </div>
                      )}
                      {(enrollment.status === "completed" || enrollment.status === "dropped") && (
                        <span className="text-xs text-muted-foreground">
                          {enrollment.completedAt ? new Date(enrollment.completedAt).toLocaleDateString() : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New Course Modal */}
      {showCourseForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-foreground">Create New Course</h3>
              <button onClick={() => setShowCourseForm(false)} className="rounded-xl p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Course Title</label>
                <input value={courseForm.title} onChange={e => setCourseForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Information Security Awareness" className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Description</label>
                <textarea value={courseForm.description} onChange={e => setCourseForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="What will employees learn?" className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1.5">Category</label>
                  <select value={courseForm.category} onChange={e => setCourseForm(p => ({ ...p, category: e.target.value }))} className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Duration (hours)</label>
                  <input type="number" value={courseForm.durationHours} onChange={e => setCourseForm(p => ({ ...p, durationHours: e.target.value }))} placeholder="2" className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Instructor</label>
                  <input value={courseForm.instructor} onChange={e => setCourseForm(p => ({ ...p, instructor: e.target.value }))} placeholder="John Smith" className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Provider</label>
                  <input value={courseForm.provider} onChange={e => setCourseForm(p => ({ ...p, provider: e.target.value }))} placeholder="Coursera, Udemy…" className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={courseForm.isRequired} onChange={e => setCourseForm(p => ({ ...p, isRequired: e.target.checked }))} className="rounded" />
                <span className="text-sm font-medium">Mark as required for all employees</span>
              </label>
            </div>
            <div className="flex gap-2.5 mt-5">
              <button onClick={() => setShowCourseForm(false)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted">Cancel</button>
              <button onClick={() => createCourse.mutate()} disabled={!courseForm.title || createCourse.isPending} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-foreground disabled:opacity-50" style={{ background: LIME }}>
                {createCourse.isPending ? "Creating…" : "Create Course"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Modal */}
      {showEnrollForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-foreground">Enroll Employee</h3>
              <button onClick={() => setShowEnrollForm(false)} className="rounded-xl p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Employee</label>
                <select value={enrollForm.employeeId} onChange={e => setEnrollForm(p => ({ ...p, employeeId: e.target.value }))} className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm">
                  <option value="">Select employee…</option>
                  {(empData?.employees ?? []).map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Course</label>
                <select value={enrollForm.courseId} onChange={e => setEnrollForm(p => ({ ...p, courseId: e.target.value }))} className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm">
                  <option value="">Select course…</option>
                  {(courses.data ?? []).filter(c => c.status === "active").map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Due Date (optional)</label>
                <input type="date" value={enrollForm.dueDate} onChange={e => setEnrollForm(p => ({ ...p, dueDate: e.target.value }))} className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm" />
              </div>
            </div>
            <div className="flex gap-2.5 mt-5">
              <button onClick={() => setShowEnrollForm(false)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted">Cancel</button>
              <button onClick={() => createEnrollment.mutate()} disabled={!enrollForm.courseId || !enrollForm.employeeId || createEnrollment.isPending} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-foreground disabled:opacity-50" style={{ background: LIME }}>
                {createEnrollment.isPending ? "Enrolling…" : "Enroll"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course detail modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-foreground">{selectedCourse.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">{selectedCourse.category.replace("_", " ")} · {selectedCourse.durationHours}h</p>
              </div>
              <button onClick={() => setSelectedCourse(null)} className="rounded-xl p-1.5 hover:bg-muted shrink-0"><X className="h-4 w-4" /></button>
            </div>
            {selectedCourse.description && <p className="text-sm text-muted-foreground mb-4">{selectedCourse.description}</p>}
            <div className="space-y-2">
              {(enrollments.data ?? []).filter(e => e.courseId === selectedCourse.id).map(e => {
                const ss = STATUS_LABELS[e.status] ?? STATUS_LABELS.enrolled;
                return (
                  <div key={e.id} className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5">
                    <div className="size-7 rounded-full bg-foreground flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {(e.firstName?.[0] ?? "") + (e.lastName?.[0] ?? "")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{e.firstName} {e.lastName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="h-1 rounded-full bg-white overflow-hidden flex-1">
                          <div className="h-full rounded-full" style={{ width: `${e.progress ?? 0}%`, background: LIME }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{e.progress ?? 0}%</span>
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0 ${ss.bg} ${ss.text}`}>{ss.label}</span>
                  </div>
                );
              })}
              {(enrollments.data ?? []).filter(e => e.courseId === selectedCourse.id).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No enrollments yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
