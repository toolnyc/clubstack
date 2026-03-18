"use client";

import { useState } from "react";

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

  if (status === "success") {
    return (
      <div className="waitlist-form__success">
        <p className="waitlist-form__success-text">You&apos;re on the list.</p>
        <p className="waitlist-form__success-sub">
          We&apos;ll reach out as we roll out access in New York.
        </p>
      </div>
    );
  }

  return (
    <form className="waitlist-form" onSubmit={handleSubmit}>
      <div className="waitlist-form__roles" role="group" aria-label="I am a">
        {ROLES.map((r) => (
          <button
            key={r.value}
            type="button"
            className={`waitlist-form__role-btn${role === r.value ? " waitlist-form__role-btn--active" : ""}`}
            onClick={() => setRole(r.value)}
            aria-pressed={role === r.value}
          >
            {r.label}
          </button>
        ))}
      </div>
      <input
        type="text"
        className="waitlist-form__name"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="name"
        disabled={status === "loading"}
        aria-label="Your name"
      />
      <div className="waitlist-form__input-row">
        <input
          type="email"
          className="waitlist-form__email"
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
          className="waitlist-form__submit"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Joining..." : "Join waitlist"}
        </button>
      </div>
      {status === "error" && (
        <p className="waitlist-form__error" role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
