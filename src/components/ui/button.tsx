"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    loading = false,
    disabled,
    children,
    className = "",
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`btn btn--${variant} btn--${size} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="btn__spinner" aria-hidden="true" /> : null}
      <span className={loading ? "btn__label--hidden" : ""}>{children}</span>
    </button>
  );
});

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };
