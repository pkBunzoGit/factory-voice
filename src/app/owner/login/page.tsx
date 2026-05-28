"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function OwnerLoginPage() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const doLogin = useCallback(async () => {
    const email = emailRef.current?.value?.trim() || "";
    const password = passRef.current?.value || "";

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/owner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Invalid email or password");
        setLoading(false);
        return;
      }

      router.push("/owner/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    doLogin();
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Owner Login</h1>
          <p className="mt-1 text-sm text-gray-500">
            View your leads and chat history
          </p>
        </div>

        <form onSubmit={handleSubmit} action="javascript:void(0)" className="space-y-4">
          <Input
            ref={emailRef}
            label="Email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
          />
          <Input
            ref={passRef}
            label="Password"
            type="password"
            placeholder="Your password"
            autoComplete="current-password"
          />

          <Button
            type="button"
            loading={loading}
            className="w-full"
            onClick={doLogin}
          >
            Sign In
          </Button>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
        </form>

        <p className="text-center text-xs text-gray-400">
          FactoryVoice Owner Dashboard
        </p>
      </div>
    </main>
  );
}
