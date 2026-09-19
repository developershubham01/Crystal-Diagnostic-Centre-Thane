"use client";

import { useState } from "react";
import { KeyRound, Loader2, LogIn, User } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoStacked } from "@/components/brand/Logo";

export interface AdminInfo {
  id: string;
  username: string;
  name: string | null;
  role: string;
}

export function LoginForm({ onSuccess }: { onSuccess: (admin: AdminInfo) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("Please enter both username and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ ok: boolean; admin: AdminInfo }>("/api/auth/login", {
        username: username.trim(),
        password,
      });
      onSuccess(res.admin);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not reach the server. Please check your connection and try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-radial-soft px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <LogoStacked />
        </div>

        <Card className="glass-card p-0">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6 text-center">
              <h1 className="display-caps text-xl text-ink">Staff Login</h1>
              <p className="mt-1 text-sm text-inkmuted">
                Restricted area — for Crystal Diagnostic Centre staff only.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive"
              >
                {error}
              </div>
            )}

            <form noValidate onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="admin-username">Username</Label>
                <div className="relative mt-1.5">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-inkmuted" aria-hidden />
                  <Input
                    id="admin-username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError(null);
                    }}
                    className="border-white/15 bg-iron pl-9 text-ink"
                    aria-invalid={!!error}
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="admin-password">Password</Label>
                <div className="relative mt-1.5">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-inkmuted" aria-hidden />
                  <Input
                    id="admin-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    className="border-white/15 bg-iron pl-9 text-ink"
                    aria-invalid={!!error}
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Signing in…
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" aria-hidden />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-inkmuted">
          Sessions expire automatically after 8 hours of signing in.
        </p>
      </div>
    </div>
  );
}
