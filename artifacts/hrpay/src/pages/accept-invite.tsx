import React, { useEffect, useState } from "react";
import { useSearch, useLocation } from "wouter";
import { useAuth } from "@/components/auth-context";
import { Check, AlertCircle, Loader2 } from "lucide-react";

const LIME = "hsl(82 80% 48%)";

export default function AcceptInvite() {
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") ?? "";
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const [info, setInfo] = useState<{ email: string; name: string; role: string; companyName: string; status: string } | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setError("No invitation token provided."); setLoadingInfo(false); return; }
    fetch(`/api/auth/invite/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setInfo(d);
      })
      .catch(() => setError("Failed to load invitation"))
      .finally(() => setLoadingInfo(false));
  }, [token]);

  async function handleAccept() {
    setAccepting(true);
    setError("");
    try {
      const r = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await r.json() as { token?: string; user?: any; error?: string };
      if (!r.ok) { setError(data.error ?? "Failed to accept invitation"); return; }
      localStorage.setItem("hrpay_token", data.token!);
      setDone(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setAccepting(false);
    }
  }

  const ROLE_LABELS: Record<string, string> = {
    company_admin: "Company Admin", ceoo: "Chief Executive Operations Officer",
    manager: "Manager", supervisor: "Supervisor", employee: "Employee",
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "hsl(220 20% 96%)" }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="flex gap-1">
            <div className="size-4 rounded-full" style={{ background: LIME }} />
            <div className="size-4 rounded-full bg-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground">HRPay</span>
        </div>

        <div className="bg-white rounded-2xl border border-border p-8 shadow-sm text-center">
          {loadingInfo ? (
            <div className="py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-3">Loading invitation…</p>
            </div>
          ) : error ? (
            <div className="py-4">
              <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <h2 className="font-bold text-foreground mb-2">Invalid Invitation</h2>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : done ? (
            <div className="py-4">
              <div className="size-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: LIME }}>
                <Check className="h-6 w-6 text-black" />
              </div>
              <h2 className="font-bold text-foreground mb-2">Welcome to HRPay!</h2>
              <p className="text-sm text-muted-foreground">Your account is ready. Redirecting to your dashboard…</p>
            </div>
          ) : info ? (
            <>
              <div className="size-14 rounded-2xl bg-foreground flex items-center justify-center mx-auto mb-5 text-white text-xl font-bold">
                {info.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">You're invited!</h2>
              <p className="text-sm text-muted-foreground mb-6">
                <span className="font-semibold text-foreground">{info.companyName}</span> has invited you to join HRPay
              </p>

              <div className="rounded-xl bg-muted/50 border border-border p-4 mb-6 text-left space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-semibold text-foreground">{info.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-semibold text-foreground">{info.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-semibold text-foreground">{ROLE_LABELS[info.role] ?? info.role}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Company</span>
                  <span className="font-semibold text-foreground">{info.companyName}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-5">
                By accepting, your account will be created with a temporary password. You can change it in settings after logging in.
              </p>

              {error && <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-sm text-destructive mb-4">{error}</div>}

              <button onClick={handleAccept} disabled={accepting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-foreground hover:opacity-90 transition-all disabled:opacity-60"
                style={{ background: LIME }}>
                {accepting ? <><Loader2 className="h-4 w-4 animate-spin" /> Accepting…</> : "Accept Invitation"}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
