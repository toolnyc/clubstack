"use client";

import { useState } from "react";
import { GripVertical, ChevronDown, ChevronRight } from "lucide-react";
import { Toggle } from "@/components/ui/input";
import type { ContractClause } from "@/types";

interface ClauseListProps {
  clauses: ContractClause[];
  onToggle: (id: string, enabled: boolean) => void;
  onContentChange: (id: string, content: string) => void;
  onReorder: (ids: string[]) => void;
}

function ClauseList({
  clauses,
  onToggle,
  onContentChange,
  onReorder,
}: ClauseListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  function handleDragStart(idx: number) {
    setDragIdx(idx);
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;

    const newClauses = [...clauses];
    const [moved] = newClauses.splice(dragIdx, 1);
    newClauses.splice(idx, 0, moved);
    onReorder(newClauses.map((c) => c.id));
    setDragIdx(idx);
  }

  function handleDragEnd() {
    setDragIdx(null);
  }

  return (
    <div className="clause-list">
      {clauses.map((clause, idx) => {
        const expanded = expandedId === clause.id;
        return (
          <div
            key={clause.id}
            className={`clause-list__item ${!clause.is_enabled ? "clause-list__item--disabled" : ""}`}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
          >
            <div className="clause-list__header">
              <GripVertical
                size={16}
                strokeWidth={1.5}
                className="clause-list__grip"
              />
              <button
                type="button"
                className="clause-list__expand"
                onClick={() => setExpandedId(expanded ? null : clause.id)}
                aria-expanded={expanded}
                aria-label={`${expanded ? "Collapse" : "Expand"} ${clause.title}`}
              >
                {expanded ? (
                  <ChevronDown size={16} strokeWidth={1.5} />
                ) : (
                  <ChevronRight size={16} strokeWidth={1.5} />
                )}
                <span className="clause-list__title">{clause.title}</span>
              </button>
              <Toggle
                label={`Enable ${clause.title}`}
                checked={clause.is_enabled}
                onChange={(checked) => onToggle(clause.id, checked)}
              />
            </div>
            {expanded && (
              <textarea
                className="clause-list__editor"
                value={clause.content}
                onChange={(e) => onContentChange(clause.id, e.target.value)}
                rows={6}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export { ClauseList };
export type { ClauseListProps };
