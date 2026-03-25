import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import type { ActionItem } from "@/lib/dashboard/actions";

interface ActionItemsProps {
  items: ActionItem[];
}

function ActionItems({ items }: ActionItemsProps) {
  if (items.length === 0) return null;

  return (
    <Card className="bg-bg-secondary border border-border-primary rounded-lg p-4">
      <CardHeader className="pb-3">
        <h2 className="font-[var(--font-display)] text-lg font-semibold text-text-primary">
          Action items
        </h2>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2">
          {items.map((item, idx) => (
            <li key={`${item.type}-${idx}`}>
              <Link
                href={item.href}
                className="flex items-center gap-3 p-2 rounded-md text-text-primary hover:bg-bg-tertiary transition-colors duration-150"
              >
                <span
                  className="font-mono text-sm text-accent-cyan flex-shrink-0"
                  aria-hidden="true"
                >
                  !
                </span>
                <span className="font-body text-sm">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export { ActionItems };
export type { ActionItemsProps };
