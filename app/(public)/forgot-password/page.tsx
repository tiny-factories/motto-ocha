"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devResetLink, setDevResetLink] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setDevResetLink(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          returnLink: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }
      setSuccess(true);
      if (data.resetLink) setDevResetLink(data.resetLink);
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-4">
      <div className="mb-8 text-center">
        <span className="text-3xl text-accent" aria-hidden>
          茶
        </span>
        <h1 className="mt-3 text-2xl font-bold text-foreground">
          Reset your password
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>
      {success ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-accent/30 bg-accent-light p-3 text-center text-sm text-accent">
            If an account exists with that email, you will receive reset
            instructions. Check your inbox (and spam).
          </div>
          {devResetLink && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <p className="font-medium">Dev only: use this link</p>
              <a
                href={devResetLink}
                className="mt-1 block break-all underline"
              >
                {devResetLink}
              </a>
            </div>
          )}
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-accent hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-card-border bg-card px-3 py-2.5 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-accent hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
