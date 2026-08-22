export type PillColor = "green" | "amber" | "red" | "blue" | "purple" | "gray";

export function Pill({
  color,
  children,
  onClick,
  className,
}: {
  color: PillColor;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const classes = `pill pill-${color}${className ? ` ${className}` : ""}`;

  if (onClick) {
    return (
      <button
        type="button"
        className={classes}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        {children}
      </button>
    );
  }

  return <span className={classes}>{children}</span>;
}
