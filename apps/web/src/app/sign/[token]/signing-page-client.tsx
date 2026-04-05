"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { SignaturePad } from "@/components/contract/signature-pad";
import { signContract } from "@/lib/contract/signature-actions";
import type { SignatureType, SignerRole } from "@/types";

interface SigningPageClientProps {
  contractId: string;
}

function SigningPageClient({ contractId }: SigningPageClientProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<SignerRole>("payer");
  const [loading, setLoading] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState("");

  async function handleSign(data: string, type: SignatureType) {
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required");
      return;
    }

    setLoading(true);
    setError("");

    const result = await signContract({
      contractId,
      signerRole: role,
      signerName: name,
      signerEmail: email,
      signatureData: data,
      signatureType: type,
      userAgent: navigator.userAgent,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSigned(true);
    setLoading(false);
  }

  if (signed) {
    return (
      <div className="signing-page__success">
        <h2 className="signing-page__success-title">Contract Signed</h2>
        <p className="signing-page__success-desc">
          Your signature has been recorded. You will receive a confirmation
          email.
        </p>
      </div>
    );
  }

  return (
    <div className="signing-page__form">
      <h2 className="signing-page__form-title">Sign this contract</h2>
      <Input
        label="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <div className="signing-page__role-select">
        <label className="input-field__label">Signing as</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as SignerRole)}
          className="signing-page__select"
        >
          <option value="payer">Payer (Venue/Promoter)</option>
          <option value="agency">Agency</option>
          <option value="artist">Artist</option>
        </select>
      </div>
      {error && <p className="signing-page__error">{error}</p>}
      <SignaturePad onSign={handleSign} loading={loading} />
    </div>
  );
}

export { SigningPageClient };
