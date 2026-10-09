import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { M, G } from "../../theme/tokens";

type Variant = "primary" | "secondary" | "ghost" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
  children?: ReactNode;
}

const variantStyles: Record<Variant, CSSProperties> = {
  primary: {
    color: "var(--primary-foreground, #FFFFFF)",
    background: G.tealBtn,
    border: "none",
    boxShadow: "0 4px 16px rgba(0, 142, 149, 0.25)",
  },
  secondary: {
    color: M.textPrimary,
    background: "var(--surface-secondary, #EEF4F7)",
    border: `1px solid ${M.border}`,
  },
  outline: {
    color: M.textSec,
    background: "transparent",
    border: `1px solid ${M.border}`,
  },
  ghost: {
    color: M.textSec,
    background: "transparent",
    border: "none",
  },
};

export function Button({ variant = "primary", icon, children, style, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "10px 20px",
        borderRadius: 14,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        transition: "all .2s",
        ...variantStyles[variant],
        ...style,
      }}
    >
      {icon}
      {children}
    </button>
  );
}
