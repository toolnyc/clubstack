import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50 disabled:pointer-events-none",
        {
          "bg-white text-black hover:bg-neutral-200": variant === "primary",
          "border border-white text-white hover:bg-white hover:text-black":
            variant === "outline",
          "text-white hover:text-neutral-300": variant === "ghost",
        },
        {
          "text-sm px-4 py-2": size === "sm",
          "text-base px-6 py-3": size === "md",
          "text-lg px-8 py-4": size === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
