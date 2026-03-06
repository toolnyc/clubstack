'use client';

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, disabled, ...props }, ref) => {
    return (
      <input
        ref={ref}
        disabled={disabled}
        className={cn(
          "w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white",
          "placeholder:text-white/40",
          "focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent",
          "disabled:pointer-events-none disabled:opacity-50",
          "transition-colors",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
