"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="login">
        <h1 className="login__title">Check your email</h1>
        <p className="login__description">
          We sent a sign-in link to <strong>{email}</strong>
        </p>
        <button
          type="button"
          className="login__resend"
          onClick={() => setSent(false)}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="login">
      <h1 className="login__title">Sign in to Clubstack</h1>
      <p className="login__description">
        Enter your email to receive a sign-in link. No password needed.
      </p>
      <form onSubmit={handleSubmit} className="login__form">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          error={error}
        />
        <Button type="submit" variant="primary" loading={loading}>
          Send sign-in link
        </Button>
      </form>
    </div>
  );
}
