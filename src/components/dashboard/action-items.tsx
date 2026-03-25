import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import type { ActionItem } from "@/lib/dashboard/actions";

const TYPE_ICONS: Record<string, string> = {
  pending_invite: "!",
  stale_draft: "!",
};

interface ActionItemsProps {
  items: ActionItem[];
}

function ActionItems({ items }: ActionItemsProps) {
  if (items.length === 0) return null;

  return (
    <Card className="dashboard__actions">
      <CardHeader>
        <h2 className="dashboard__section-title">Action items</h2>
      </CardHeader>
      <CardContent>
        <ul className="dashboard__action-list">
          {items.map((item, idx) => (
            <li key={`${item.type}-${idx}`}>
              <Link
                href={item.href}
                className={`dashboard__action-item dashboard__action-item--${item.type}`}
              >
                <span
                  className="dashboard__action-indicator"
                  aria-hidden="true"
                >
                  {TYPE_ICONS[item.type] ?? "!"}
                </span>
                <span className="dashboard__action-label">{item.label}</span>
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
