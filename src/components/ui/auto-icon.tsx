import { generateAutoIcon } from "@/lib/auto-icon";

interface AutoIconProps {
  name: string;
  size?: number;
  className?: string;
}

function AutoIcon({ name, size = 40, className = "" }: AutoIconProps) {
  const src = generateAutoIcon(name, size);

  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={`auto-icon ${className}`}
      aria-hidden="true"
    />
  );
}

export { AutoIcon };
export type { AutoIconProps };
