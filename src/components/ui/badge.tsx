import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    "bg-white text-black",
  secondary:
    "bg-white/10 text-white",
  outline:
    "bg-transparent text-white border border-white/30",
};

function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        "transition-colors",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge };
export type { BadgeProps };
