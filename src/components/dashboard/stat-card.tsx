import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  className?: string;
}

function StatCard({ label, value, className = "" }: StatCardProps) {
  return (
    <Card
      className={`bg-bg-secondary border border-border-primary rounded-lg p-4 ${className}`}
    >
      <CardContent className="flex flex-col gap-1">
        <span className="font-[var(--font-display)] text-2xl font-semibold text-text-primary">
          {value}
        </span>
        <span className="font-mono text-sm text-text-secondary">{label}</span>
      </CardContent>
    </Card>
  );
}

export { StatCard };
export type { StatCardProps };
