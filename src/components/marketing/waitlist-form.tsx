"use client";

import { useState } from "react";
import { FormTransition } from "@/components/ui/form-transition";

type Role = "dj" | "promoter" | "agency" | "venue";
type Status = "idle" | "loading" | "success" | "error";

const ROLES: { value: Role; label: string }[] = [
  { value: "dj", label: "DJ" },
  { value: "promoter", label: "Promoter" },
  { value: "agency", label: "Agency" },
  { value: "venue", label: "Venue" },
];

interface WaitlistFormProps {
  defaultRole?: Role;
}

export function WaitlistForm({ defaultRole = "dj" }: WaitlistFormProps) {
  const [role, setRole] = useState<Role>(defaultRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, name: name.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(data.error ?? "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  }

  return (
    <FormTransition stateKey={status === "success" ? "success" : "form"}>
      {status === "success" ? (
        <div className="py-4">
          <p className="font-[var(--font-display)] text-xl font-medium text-accent-neon mb-2">
            You&apos;re on the list.
          </p>
          <p className="font-body text-sm text-text-secondary">
            We&apos;ll reach out as we roll out access in New York.
          </p>
        </div>
      ) : (
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div
            className="flex gap-2 flex-wrap"
            role="group"
            aria-label="I am a"
          >
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                className={`px-4 py-1.5 rounded-full border font-body text-sm cursor-pointer transition-colors duration-200 ${
                  role === r.value
                    ? "border-accent-neon text-accent-neon bg-accent-neon-muted"
                    : "border-border-primary bg-transparent text-text-secondary hover:border-text-secondary hover:text-text-primary"
                }`}
                onClick={() => setRole(r.value)}
                aria-pressed={role === r.value}
              >
                {r.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="h-11 px-4 rounded-md border border-border-primary bg-bg-secondary text-text-primary font-body text-base outline-none transition-colors duration-200 min-w-0 placeholder:text-text-tertiary focus:border-accent-neon"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            disabled={status === "loading"}
            aria-label="Your name"
          />
          <div className="flex gap-2 mb-2">
            <input
              type="email"
              className="flex-1 h-11 px-4 rounded-md border border-border-primary bg-bg-secondary text-text-primary font-body text-base outline-none transition-colors duration-200 min-w-0 placeholder:text-text-tertiary focus:border-accent-neon"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={status === "loading"}
              aria-label="Email address"
            />
            <button
              type="submit"
              className="h-11 px-6 rounded-md bg-accent-neon text-[#0a0a0a] font-body text-sm font-medium border-none cursor-pointer whitespace-nowrap transition-opacity duration-200 hover:opacity-88 disabled:opacity-55 disabled:cursor-not-allowed"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Joining..." : "Join waitlist"}
            </button>
          </div>
          {status === "error" && (
            <p className="font-body text-sm text-status-error" role="alert">
              {errorMessage}
            </p>
          )}
        </form>
      )}
    </FormTransition>
  );
}
