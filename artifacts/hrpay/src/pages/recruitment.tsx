import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, apiHeaders } from "@/components/auth-context";
import { Briefcase, Plus, X, ChevronRight, MapPin, DollarSign, Clock, Users } from "lucide-react";

const API = "/api";

const STAGES = [
  { id: "applied", label: "Applied", color: "bg-blue-100 text-blue-700" },
  { id: "screening", label: "Screening", color: "bg-yellow-100 text-yellow-700" },
  { id: "interview", label: "Interview", color: "bg-purple-100 text-purple-700" },
  { id: "offer", label: "Offer", color: "bg-orange-100 text-orange-700" },
  { id: "hired", label: "Hired", color: "bg-green-100 text-green-700" },
  { id: "rejected", label: "Rejected", color: "bg-red-100 text-red-700" },
];

interface Job { id: number; title: string; departmentName?: string; type: string; location?: string; salaryMin?: string; salaryMax?: string; status: string; createdAt: string; }
interface Application { id: number; jobId: number; candidateName: string; candidateEmail: string; stage: string; rating?: number; notes?: string; createdAt: string; }

export default function Recruitment() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showAppForm, setShowAppForm] = useState(false);
  const [newJob, setNewJob] = useState({ title: "", location: "", type: "full_time", salaryMin: "", salaryMax: "", description: "", status: "open" });
  const [newApp, setNewApp] = useState({ candidateName: "", candidateEmail: "", phone: "", source: "" });

  const jobs = useQuery<Job[]>({ queryKey: ["jobs"], queryFn: () => fetch(`${API}/recruitment/jobs`, { headers: apiHeaders(token) }).then(r => r.json()) });
  const apps = useQuery<Application[]>({ queryKey: ["applications", selectedJob?.id], queryFn: () => fetch(`${API}/recruitment/applications?jobId=${selectedJob?.id}`, { headers: apiHeaders(token) }).then(r => r.json()), enabled: !!selectedJob });

  const createJob = useMutation({ mutationFn: (body: typeof newJob) => fetch(`${API}/recruitment/jobs`, { method: "POST", headers: apiHeaders(token), body: JSON.stringify(body) }).then(r => r.json()), onSuccess: () => { qc.invalidateQueries({ queryKey: ["jobs"] }); setShowJobForm(false); setNewJob({ title: "", location: "", type: "full_time", salaryMin: "", salaryMax: "", description: "", status: "open" }); } });
  const createApp = useMutation({ mutationFn: (body: object) => fetch(`${API}/recruitment/applications`, { method: "POST", headers: apiHeaders(token), body: JSON.stringify(body) }).then(r => r.json()), onSuccess: () => { qc.invalidateQueries({ queryKey: ["applications"] }); setShowAppForm(false); } });
  const moveApp = useMutation({ mutationFn: ({ id, stage }: { id: number; stage: string }) => fetch(`${API}/recruitment/applications/${id}`, { method: "PATCH", headers: apiHeaders(token), body: JSON.stringify({ stage }) }).then(r => r.json()), onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }) });
  const closeJob = useMutation({ mutationFn: (id: number) => fetch(`${API}/recruitment/jobs/${id}`, { method: "PATCH", headers: apiHeaders(token), body: JSON.stringify({ status: "closed" }) }).then(r => r.json()), onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }) });

  const appsByStage = (stage: string) => (apps.data ?? []).filter(a => a.stage === stage);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Recruitment & ATS</h2>
          <p className="text-sm text-muted-foreground">{(jobs.data ?? []).filter(j => j.status === "open").length} open positions</p>
        </div>
        <button onClick={() => setShowJobForm(true)} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:opacity-90" style={{ background: "hsl(82 80% 48%)" }}>
          <Plus className="h-4 w-4" /> New Job Posting
        </button>
      </div>

      {/* Job list + Kanban split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Job Postings */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Job Postings</h3>
          {jobs.isLoading ? (
            <div className="text-sm text-muted-foreground p-4">Loading…</div>
          ) : (jobs.data ?? []).length === 0 ? (
            <div className="rounded-2xl border border-border bg-white p-6 text-center text-sm text-muted-foreground">No job postings yet. Create one to get started.</div>
          ) : (
            (jobs.data ?? []).map(job => (
              <button key={job.id} onClick={() => setSelectedJob(job)} className={`w-full text-left rounded-2xl border p-4 transition-all ${selectedJob?.id === job.id ? "border-foreground shadow-sm" : "border-border bg-white hover:border-muted-foreground/30"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{job.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{job.departmentName ?? "No dept"}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${job.status === "open" ? "text-foreground" : "bg-muted text-muted-foreground"}`} style={job.status === "open" ? { background: "hsl(82 80% 48%)" } : {}}>
                    {job.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.type.replace("_", " ")}</span>
                </div>
                {(job.salaryMin || job.salaryMax) && (
                  <p className="text-xs mt-1 font-medium text-foreground">
                    ${Number(job.salaryMin).toLocaleString()} – ${Number(job.salaryMax).toLocaleString()}
                  </p>
                )}
              </button>
            ))
          )}
        </div>

        {/* Kanban board */}
        <div className="lg:col-span-2">
          {!selectedJob ? (
            <div className="rounded-2xl border border-dashed border-border bg-white/50 flex items-center justify-center h-64">
              <div className="text-center">
                <Briefcase className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Select a job posting to view the applicant pipeline</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-foreground">{selectedJob.title}</h3>
                  <p className="text-xs text-muted-foreground">{(apps.data ?? []).length} total applicants</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowAppForm(true)} className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-xs font-medium hover:bg-muted transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Add Applicant
                  </button>
                  {selectedJob.status === "open" && (
                    <button onClick={() => closeJob.mutate(selectedJob.id)} className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-medium hover:bg-muted transition-colors text-muted-foreground">
                      Close Job
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 overflow-x-auto">
                {STAGES.slice(0, 5).map(stage => (
                  <div key={stage.id} className="rounded-xl bg-muted/50 p-2 min-w-[140px]">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stage.color}`}>{stage.label}</span>
                      <span className="text-xs text-muted-foreground">{appsByStage(stage.id).length}</span>
                    </div>
                    <div className="space-y-1.5">
                      {appsByStage(stage.id).length === 0 && (
                        <p className="text-[11px] text-muted-foreground/60 text-center py-3 italic">No applicants</p>
                      )}
                      {appsByStage(stage.id).map(app => (
                        <div key={app.id} className="rounded-lg bg-white border border-border p-2.5 shadow-sm">
                          <p className="text-xs font-semibold text-foreground truncate">{app.candidateName}</p>
                          <p className="text-xs text-muted-foreground truncate">{app.candidateEmail}</p>
                          <div className="flex gap-1 mt-1.5">
                            {STAGES.filter(s => s.id !== stage.id && s.id !== "rejected").slice(0, 2).map(s => (
                              <button key={s.id} onClick={() => moveApp.mutate({ id: app.id, stage: s.id })} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground hover:bg-foreground hover:text-white transition-colors">
                                → {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Job Form Modal */}
      {showJobForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">New Job Posting</h3>
              <button onClick={() => setShowJobForm(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              {[["Job Title", "title", "text"], ["Location", "location", "text"]].map(([l, k, t]) => (
                <div key={k}>
                  <label className="text-xs font-medium text-muted-foreground">{l}</label>
                  <input type={t} value={(newJob as Record<string, string>)[k]} onChange={e => setNewJob(p => ({ ...p, [k]: e.target.value }))} className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2" style={{ "--tw-ring-color": "hsl(82 80% 48%)" } as React.CSSProperties} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Min Salary</label>
                  <input type="number" value={newJob.salaryMin} onChange={e => setNewJob(p => ({ ...p, salaryMin: e.target.value }))} className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Max Salary</label>
                  <input type="number" value={newJob.salaryMax} onChange={e => setNewJob(p => ({ ...p, salaryMax: e.target.value }))} className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Type</label>
                <select value={newJob.type} onChange={e => setNewJob(p => ({ ...p, type: e.target.value }))} className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none">
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="intern">Internship</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <textarea value={newJob.description} onChange={e => setNewJob(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowJobForm(false)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              <button onClick={() => createJob.mutate(newJob)} disabled={!newJob.title || createJob.isPending} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-foreground disabled:opacity-50" style={{ background: "hsl(82 80% 48%)" }}>
                {createJob.isPending ? "Creating…" : "Create Job"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Applicant Modal */}
      {showAppForm && selectedJob && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">Add Applicant — {selectedJob.title}</h3>
              <button onClick={() => setShowAppForm(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              {[["Name", "candidateName"], ["Email", "candidateEmail"], ["Phone", "phone"], ["Source", "source"]].map(([l, k]) => (
                <div key={k}>
                  <label className="text-xs font-medium text-muted-foreground">{l}</label>
                  <input type="text" value={(newApp as Record<string, string>)[k]} onChange={e => setNewApp(p => ({ ...p, [k]: e.target.value }))} className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowAppForm(false)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              <button onClick={() => createApp.mutate({ ...newApp, jobId: selectedJob.id, stage: "applied" })} disabled={!newApp.candidateName || !newApp.candidateEmail || createApp.isPending} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-foreground disabled:opacity-50" style={{ background: "hsl(82 80% 48%)" }}>
                {createApp.isPending ? "Adding…" : "Add Applicant"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
