import type { HTMLAttributes, ReactNode } from "react";

type BadgeVariant = "default" | "cyan" | "neon" | "error";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}

function Badge({
  variant = "default",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={`badge badge--${variant} ${className}`} {...props}>
      {children}
    </span>
  );
}

export { Badge };
export type { BadgeProps, BadgeVariant };
