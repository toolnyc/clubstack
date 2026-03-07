import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline" | "secondary";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-black text-white hover:bg-gray-800":
            variant === "default",
          "border-gray-300 bg-transparent hover:bg-gray-100":
            variant === "outline",
          "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200":
            variant === "secondary",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
