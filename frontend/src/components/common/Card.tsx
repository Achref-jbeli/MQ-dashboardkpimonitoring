import type { ReactNode, CSSProperties } from "react";
import { cardBase } from "../../theme/tokens";

export function Card({ children, style = {} }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ ...cardBase, ...style }}>{children}</div>;
}
