import { Search } from "lucide-react";
import { M } from "../../theme/tokens";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  maxWidth = 320,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxWidth?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flex: 1,
        maxWidth,
        padding: "0 16px",
        borderRadius: 18,
        background: M.white,
        border: `1px solid ${M.border}`,
      }}
    >
      <Search size={14} style={{ color: M.textSec }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: "12px 0",
          fontSize: 12,
          outline: "none",
          background: "transparent",
          color: M.textPrimary,
          border: "none",
        }}
      />
    </div>
  );
}