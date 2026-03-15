import type { ReactNode } from "react";

interface TopBarProps {
  title: string;
  actions?: ReactNode;
  className?: string;
}

function TopBar({ title, actions, className = "" }: TopBarProps) {
  return (
    <header className={`topbar ${className}`}>
      <h1 className="topbar__title">{title}</h1>
      {actions ? <div className="topbar__actions">{actions}</div> : null}
    </header>
  );
}

export { TopBar };
export type { TopBarProps };
