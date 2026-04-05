type StatusType =
  | "available"
  | "busy"
  | "booked"
  | "hold"
  | "paid"
  | "overdue"
  | "error";

const STATUS_LABELS: Record<StatusType, string> = {
  available: "Available",
  busy: "Busy",
  booked: "Booked",
  hold: "Hold",
  paid: "Paid",
  overdue: "Overdue",
  error: "Error",
};

interface StatusDotProps {
  status: StatusType;
  label?: string;
  className?: string;
}

function StatusDot({ status, label, className = "" }: StatusDotProps) {
  const displayLabel = label ?? STATUS_LABELS[status];

  return (
    <span className={`status-dot status-dot--${status} ${className}`}>
      <span className="status-dot__dot" aria-hidden="true" />
      <span className="status-dot__label">{displayLabel}</span>
    </span>
  );
}

export { StatusDot };
export type { StatusDotProps, StatusType };
