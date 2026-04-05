"use server";

import { createClient } from "@/lib/supabase/server";
import { getDefaultClauses } from "./clause-defaults";
import type { Contract, ContractClause, SignatureConfig } from "@/types";

export async function createContract(bookingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated", contractId: null };

  // Create contract
  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .insert({
      booking_id: bookingId,
      status: "draft",
      signature_config: "agency_only",
    })
    .select("id")
    .single();

  if (contractError) return { error: contractError.message, contractId: null };

  // Create default clauses
  const defaults = getDefaultClauses();
  const { error: clausesError } = await supabase
    .from("contract_clauses")
    .insert(
      defaults.map((c, i) => ({
        contract_id: contract.id,
        clause_type: c.type,
        title: c.title,
        content: c.content,
        is_enabled: true,
        sort_order: i,
      }))
    );

  if (clausesError)
    return { error: clausesError.message, contractId: contract.id };
  return { error: null, contractId: contract.id };
}

export async function getContract(contractId: string) {
  const supabase = await createClient();

  const { data: contract } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", contractId)
    .single();

  if (!contract) return null;

  const { data: clauses } = await supabase
    .from("contract_clauses")
    .select("*")
    .eq("contract_id", contractId)
    .order("sort_order");

  return {
    contract: contract as Contract,
    clauses: (clauses as ContractClause[]) ?? [],
  };
}

export async function getContractByBooking(bookingId: string) {
  const supabase = await createClient();

  const { data: contract } = await supabase
    .from("contracts")
    .select("*")
    .eq("booking_id", bookingId)
    .single();

  if (!contract) return null;

  const { data: clauses } = await supabase
    .from("contract_clauses")
    .select("*")
    .eq("contract_id", contract.id)
    .order("sort_order");

  return {
    contract: contract as Contract,
    clauses: (clauses as ContractClause[]) ?? [],
  };
}

export async function toggleClause(clauseId: string, enabled: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("contract_clauses")
    .update({ is_enabled: enabled })
    .eq("id", clauseId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function updateClauseContent(clauseId: string, content: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("contract_clauses")
    .update({ content })
    .eq("id", clauseId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function reorderClauses(clauseIds: string[]) {
  const supabase = await createClient();

  const updates = clauseIds.map((id, i) =>
    supabase.from("contract_clauses").update({ sort_order: i }).eq("id", id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };
  return { error: null };
}

export async function updateSignatureConfig(
  contractId: string,
  config: SignatureConfig
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("contracts")
    .update({ signature_config: config })
    .eq("id", contractId);

  if (error) return { error: error.message };
  return { error: null };
}
