"use server";

import { createClient } from "@/lib/supabase/server";
import type { ContractSignature, SignerRole, SignatureType } from "@/types";

interface SignInput {
  contractId: string;
  signerRole: SignerRole;
  signerName: string;
  signerEmail: string;
  signatureData: string;
  signatureType: SignatureType;
  ipAddress?: string;
  userAgent?: string;
}

export async function signContract(input: SignInput) {
  const supabase = await createClient();

  // Get current user if authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: sigError } = await supabase
    .from("contract_signatures")
    .insert({
      contract_id: input.contractId,
      signer_role: input.signerRole,
      signer_name: input.signerName,
      signer_email: input.signerEmail,
      signer_user_id: user?.id ?? null,
      signature_data: input.signatureData,
      signature_type: input.signatureType,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
    });

  if (sigError) return { error: sigError.message };

  // Check if contract is fully signed
  const { data: contract } = await supabase
    .from("contracts")
    .select("id, signature_config")
    .eq("id", input.contractId)
    .single();

  if (!contract) return { error: "Contract not found" };

  const { data: sigs } = await supabase
    .from("contract_signatures")
    .select("signer_role")
    .eq("contract_id", input.contractId);

  const roles = new Set(
    (sigs ?? []).map((s: { signer_role: string }) => s.signer_role)
  );

  let fullySignedCheck = false;
  if (contract.signature_config === "agency_only") {
    fullySignedCheck = roles.has("agency");
  } else {
    fullySignedCheck = roles.has("agency") && roles.has("artist");
  }

  if (fullySignedCheck) {
    await supabase
      .from("contracts")
      .update({ status: "signed" })
      .eq("id", input.contractId);
  }

  return { error: null };
}

export async function getSignatures(
  contractId: string
): Promise<ContractSignature[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("contract_signatures")
    .select("*")
    .eq("contract_id", contractId)
    .order("signed_at");

  return (data as ContractSignature[]) ?? [];
}

export async function getContractByToken(signingToken: string) {
  const supabase = await createClient();

  const { data: contract } = await supabase
    .from("contracts")
    .select("*, booking:bookings(*)")
    .eq("signing_token", signingToken)
    .single();

  if (!contract) return null;

  const { data: clauses } = await supabase
    .from("contract_clauses")
    .select("*")
    .eq("contract_id", contract.id)
    .eq("is_enabled", true)
    .order("sort_order");

  return {
    contract,
    clauses: clauses ?? [],
  };
}

export async function sendContractEmail(contractId: string) {
  // Placeholder for Resend integration
  // Updates contract status to 'sent'
  const supabase = await createClient();

  const { error } = await supabase
    .from("contracts")
    .update({ status: "sent" })
    .eq("id", contractId);

  if (error) return { error: error.message };
  return { error: null };
}
