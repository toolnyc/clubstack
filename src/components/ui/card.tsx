import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "border border-neutral-800 bg-neutral-900 p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn("text-xl font-bold tracking-tight text-white", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export function CardContent({
  className,
  children,
  ...props
}: CardContentProps) {
  return (
    <div className={cn("text-neutral-400 leading-relaxed", className)} {...props}>
      {children}
    </div>
  );
}
