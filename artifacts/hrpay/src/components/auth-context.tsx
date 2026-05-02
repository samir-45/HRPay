import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/^\/hrpay/, "") + "/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("hrpay_token"));
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("hrpay_token");
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("hrpay_token");
    if (!stored) { setIsLoading(false); return; }

    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${stored}` } })
      .then(r => r.ok ? r.json() : null)
      .then((u: AuthUser | null) => {
        if (u) { setUser(u); setToken(stored); }
        else logout();
      })
      .catch(logout)
      .finally(() => setIsLoading(false));
  }, [logout]);

  const login = async (email: string, password: string) => {
    const r = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error ?? "Login failed");
    }
    const { token: t, user: u } = await r.json() as { token: string; user: AuthUser };
    localStorage.setItem("hrpay_token", t);
    setToken(t);
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

export function apiHeaders(token: string | null): HeadersInit {
  return token ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` } : { "Content-Type": "application/json" };
}
