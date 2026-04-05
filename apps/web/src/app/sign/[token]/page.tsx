import { notFound } from "next/navigation";
import { getContractByToken } from "@/lib/contract/signature-actions";
import { ContractPreview } from "@/components/contract/contract-preview";
import { SigningPageClient } from "./signing-page-client";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function SigningPage({ params }: Props) {
  const { token } = await params;
  const result = await getContractByToken(token);

  if (!result) notFound();

  const { contract, clauses } = result;

  if (contract.status === "signed") {
    return (
      <div className="signing-page">
        <div className="signing-page__signed">
          <h1 className="signing-page__title">Contract Already Signed</h1>
          <p className="signing-page__desc">
            This contract has already been fully signed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="signing-page">
      <ContractPreview clauses={clauses} />
      <SigningPageClient contractId={contract.id} />
    </div>
  );
}
