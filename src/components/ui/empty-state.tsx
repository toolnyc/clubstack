import { Button } from "./button";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  icon?: React.ReactNode;
  className?: string;
}

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  icon,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`}>
      {icon && <div className="empty-state__icon">{icon}</div>}
      <h2 className="empty-state__title">{title}</h2>
      {description && <p className="empty-state__description">{description}</p>}
      {actionLabel &&
        (actionHref ? (
          <a href={actionHref}>
            <Button variant="primary">{actionLabel}</Button>
          </a>
        ) : (
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        ))}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
