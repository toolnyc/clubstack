import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  className?: string;
}

function StatCard({ label, value, className = "" }: StatCardProps) {
  return (
    <Card className={`dashboard__stat-card ${className}`}>
      <CardContent>
        <span className="dashboard__stat-value">{value}</span>
        <span className="dashboard__stat-label">{label}</span>
      </CardContent>
    </Card>
  );
}

export { StatCard };
export type { StatCardProps };
