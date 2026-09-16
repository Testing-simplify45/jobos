"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-bg px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-card border border-base-border bg-base-panel p-6"
      >
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-dim font-mono text-sm text-accent">
            {">_"}
          </span>
          <span className="font-mono text-[15px] font-semibold text-text-primary">
            Career<span className="text-accent">OS</span>
          </span>
        </div>

        <h1 className="mb-1 text-lg font-semibold text-text-primary">Log in</h1>
        <p className="mb-5 text-[13px] text-text-secondary">
          Welcome back to your job search operating system.
        </p>

        {error && (
          <div className="mb-4 rounded-md border border-warn/40 bg-warn-dim px-3 py-2 text-[13px] text-warn">
            {error}
          </div>
        )}

        <label className="mb-1 block text-[12px] text-text-secondary">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3 w-full rounded-md border border-base-border bg-base-bg px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent"
        />

        <label className="mb-1 block text-[12px] text-text-secondary">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-5 w-full rounded-md border border-base-border bg-base-bg px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-accent py-2 text-[13px] font-medium text-base-bg hover:bg-accent-bright disabled:opacity-60"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>

        <p className="mt-4 text-center text-[13px] text-text-secondary">
          No account?{" "}
          <a href="/signup" className="text-accent">
            Sign up
          </a>
        </p>
      </form>
    </div>
  );
}
