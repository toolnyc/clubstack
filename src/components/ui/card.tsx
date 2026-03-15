import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: ReactNode;
}

function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
}

function CardHeader({ className = "", children, ...props }: CardProps) {
  return (
    <div className={`card__header ${className}`} {...props}>
      {children}
    </div>
  );
}

function CardContent({ className = "", children, ...props }: CardProps) {
  return (
    <div className={`card__content ${className}`} {...props}>
      {children}
    </div>
  );
}

function CardFooter({ className = "", children, ...props }: CardProps) {
  return (
    <div className={`card__footer ${className}`} {...props}>
      {children}
    </div>
  );
}

export { Card, CardHeader, CardContent, CardFooter };
export type { CardProps };
