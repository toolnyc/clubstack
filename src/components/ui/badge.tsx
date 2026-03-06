import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline";
}

export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-xs font-semibold tracking-wider uppercase px-3 py-1",
        {
          "bg-white text-black": variant === "default",
          "border border-white text-white": variant === "outline",
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
