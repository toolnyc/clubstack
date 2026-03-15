"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClauseList } from "./clause-list";
import { ContractPreview } from "./contract-preview";
import { Button } from "@/components/ui/button";
import {
  toggleClause,
  updateClauseContent,
  reorderClauses,
} from "@/lib/contract/actions";
import { useBreakpoint } from "@/lib/hooks/use-breakpoint";
import type { ContractClause } from "@/types";

interface ContractBuilderProps {
  contractId: string;
  initialClauses: ContractClause[];
}

function ContractBuilder({ contractId, initialClauses }: ContractBuilderProps) {
  const router = useRouter();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";

  const [clauses, setClauses] = useState(initialClauses);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);

  function handleToggle(id: string, enabled: boolean) {
    setClauses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_enabled: enabled } : c))
    );
    toggleClause(id, enabled);
  }

  function handleContentChange(id: string, content: string) {
    setClauses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, content } : c))
    );
  }

  async function handleContentBlur(id: string, content: string) {
    await updateClauseContent(id, content);
  }

  function handleReorder(ids: string[]) {
    const ordered = ids
      .map((id) => clauses.find((c) => c.id === id))
      .filter(Boolean) as ContractClause[];
    setClauses(ordered);
    reorderClauses(ids);
  }

  async function handleSave() {
    setSaving(true);
    // Save all clause contents
    await Promise.all(clauses.map((c) => updateClauseContent(c.id, c.content)));
    setSaving(false);
    router.refresh();
  }

  if (isMobile) {
    return (
      <div className="contract-builder">
        <div className="contract-builder__tabs">
          <button
            type="button"
            className={`contract-builder__tab ${activeTab === "edit" ? "contract-builder__tab--active" : ""}`}
            onClick={() => setActiveTab("edit")}
          >
            Edit
          </button>
          <button
            type="button"
            className={`contract-builder__tab ${activeTab === "preview" ? "contract-builder__tab--active" : ""}`}
            onClick={() => setActiveTab("preview")}
          >
            Preview
          </button>
        </div>
        {activeTab === "edit" ? (
          <ClauseList
            clauses={clauses}
            onToggle={handleToggle}
            onContentChange={(id, content) => {
              handleContentChange(id, content);
              handleContentBlur(id, content);
            }}
            onReorder={handleReorder}
          />
        ) : (
          <ContractPreview clauses={clauses} />
        )}
        <div className="contract-builder__footer">
          <Button variant="primary" onClick={handleSave} loading={saving}>
            Save contract
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="contract-builder">
      <div className="contract-builder__split">
        <div className="contract-builder__edit-panel">
          <ClauseList
            clauses={clauses}
            onToggle={handleToggle}
            onContentChange={(id, content) => {
              handleContentChange(id, content);
              handleContentBlur(id, content);
            }}
            onReorder={handleReorder}
          />
          <div className="contract-builder__footer">
            <Button variant="primary" onClick={handleSave} loading={saving}>
              Save contract
            </Button>
          </div>
        </div>
        <div className="contract-builder__preview-panel">
          <ContractPreview clauses={clauses} />
        </div>
      </div>
    </div>
  );
}

export { ContractBuilder };
export type { ContractBuilderProps };
