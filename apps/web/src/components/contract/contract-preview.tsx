import type { ContractClause } from "@/types";

interface ContractPreviewProps {
  clauses: ContractClause[];
  className?: string;
}

function ContractPreview({ clauses, className = "" }: ContractPreviewProps) {
  const enabled = clauses.filter((c) => c.is_enabled);

  return (
    <div className={`contract-preview ${className}`}>
      <div className="contract-preview__header">
        <h2 className="contract-preview__title">Performance Agreement</h2>
        <p className="contract-preview__subtitle">Contract Preview</p>
      </div>
      {enabled.length === 0 ? (
        <p className="contract-preview__empty">
          Enable at least one clause to see the preview.
        </p>
      ) : (
        enabled.map((clause, idx) => (
          <div key={clause.id} className="contract-preview__clause">
            <h3 className="contract-preview__clause-title">
              {idx + 1}. {clause.title}
            </h3>
            <div className="contract-preview__clause-content">
              {clause.content.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export { ContractPreview };
export type { ContractPreviewProps };
