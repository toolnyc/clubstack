"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { FeeLine } from "@clubstack/shared";

const payeeSchema = z.object({
  recipient_user_id: z.string().uuid(),
  role_label: z.string().min(1).max(100),
  entitlement_kind: z.enum(["fixed", "pct"]),
  entitlement_value: z.number().min(0),
  priority: z.number().int().min(0).default(0),
});

const feeLineSchema = z.object({
  description: z.string().min(1).max(200),
  amount: z.number().min(0),
  payees: z.array(payeeSchema).min(1),
});

const termsSchema = z.array(feeLineSchema);

export type FeeLineInput = z.input<typeof feeLineSchema>;

export async function setContractTerms(
  contractId: string,
  feeLines: FeeLineInput[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, status")
    .eq("id", contractId)
    .single();

  if (!contract) return { error: "Contract not found" };
  if (contract.status === "signed") {
    return { error: "Cannot edit terms of a signed contract" };
  }

  const parsed = termsSchema.safeParse(feeLines);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Replace-all: clear existing lines (payees cascade) then re-insert.
  const { error: deleteError } = await supabase
    .from("contract_fee_lines")
    .delete()
    .eq("contract_id", contractId);

  if (deleteError) return { error: deleteError.message };

  if (parsed.data.length === 0) return { error: null };

  const { data: insertedLines, error: linesError } = await supabase
    .from("contract_fee_lines")
    .insert(
      parsed.data.map((line, index) => ({
        contract_id: contractId,
        description: line.description,
        amount: line.amount,
        sort_order: index,
      }))
    )
    .select("id, sort_order");

  if (linesError) return { error: linesError.message };

  const lineIdByOrder = new Map(
    (insertedLines ?? []).map((l) => [l.sort_order as number, l.id as string])
  );

  const payeeRows = parsed.data.flatMap((line, lineIndex) => {
    const feeLineId = lineIdByOrder.get(lineIndex);
    if (!feeLineId) return [];
    return line.payees.map((payee, payeeIndex) => ({
      fee_line_id: feeLineId,
      recipient_user_id: payee.recipient_user_id,
      role_label: payee.role_label,
      entitlement_kind: payee.entitlement_kind,
      entitlement_value: payee.entitlement_value,
      priority: payee.priority ?? 0,
      sort_order: payeeIndex,
    }));
  });

  if (payeeRows.length > 0) {
    const { error: payeesError } = await supabase
      .from("contract_fee_line_payees")
      .insert(payeeRows);

    if (payeesError) return { error: payeesError.message };
  }

  return { error: null };
}

export async function getContractTerms(contractId: string): Promise<FeeLine[]> {
  const supabase = await createClient();

  const { data: lines } = await supabase
    .from("contract_fee_lines")
    .select("id, description, amount, sort_order")
    .eq("contract_id", contractId)
    .order("sort_order");

  if (!lines || lines.length === 0) return [];

  const { data: payees } = await supabase
    .from("contract_fee_line_payees")
    .select(
      "fee_line_id, recipient_user_id, role_label, entitlement_kind, entitlement_value, priority, sort_order"
    )
    .in(
      "fee_line_id",
      lines.map((l) => l.id)
    )
    .order("sort_order");

  return lines.map((line) => ({
    description: line.description as string,
    amount: Number(line.amount),
    payees: (payees ?? [])
      .filter((p) => p.fee_line_id === line.id)
      .map((p) => ({
        recipient_user_id: p.recipient_user_id as string,
        role_label: p.role_label as string,
        priority: p.priority as number,
        entitlement: {
          kind: p.entitlement_kind as "fixed" | "pct",
          value: Number(p.entitlement_value),
        },
      })),
  }));
}
