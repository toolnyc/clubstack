import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/5 overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardContent({ className, children }: CardProps) {
  return <div className={cn("p-4", className)}>{children}</div>;
}
