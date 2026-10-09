import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Home, Monitor, Menu, X } from "lucide-react";
import { M, G } from "../../theme/tokens";
import { MarquardtLogo } from "../common/Logo";
import type { Page } from "../../types/dashboard";
import type { Employee } from "../../types/employee";
import LogoutButton from "../common/LogoutButton";
import { ThemeSelector } from "../common/ThemeSelector";
import { useIsDesktop } from "../../hooks/useMediaQuery";

interface NavItem {
  id: string;
  icon?: ReactNode;
  label: string;
  divider?: boolean;
}

export interface ProtectedSidebarProps {
  title: string;
  role: string;
  nav: NavItem[];
  active: string;
  onSelect: (s: string) => void;
  onNavigate: (p: Page) => void;
  userEmp?: Employee | null;
}

export function ProtectedSidebar({
  title,
  role,
  nav,
  active,
  onSelect,
  onNavigate,
  userEmp,
}: ProtectedSidebarProps) {
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isDesktop) setOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const select = (id: string) => {
    onSelect(id);
    if (!isDesktop) setOpen(false);
  };

  return (
    <>
      <header className="app-mobile-bar">
        <button type="button" onClick={() => setOpen(true)} aria-label="Open navigation">
          <Menu size={18} />
        </button>
        <span>{title}</span>
        <div style={{ marginLeft: "auto" }}>
          <ThemeSelector compact />
        </div>
      </header>

      {!isDesktop && open && (
        <div className="app-sidebar-backdrop" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`app-sidebar${isDesktop || open ? " is-open" : ""}`}
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "24px 0",
          background: G.sidebar,
        }}
      >
        <div style={{ padding: "0 16px", marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <MarquardtLogo height={72} light />
            <p style={{ fontSize: 10, fontFamily: "DM Mono, monospace", color: "rgba(255,255,255,0.35)", margin: "6px 0 0", letterSpacing: "0.08em" }}>
              {title}
            </p>
          </div>
          <button
            type="button"
            className="app-sidebar-close"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            style={{
              width: 36,
              height: 36,
              border: "none",
              borderRadius: 10,
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              cursor: "pointer",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "0 10px", overflowY: "auto" }}>
          {nav.map((item) => {
            if (item.divider) {
              return (
                <div
                  key={item.id}
                  style={{
                    padding: "14px 14px 4px",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.25)",
                    fontFamily: "DM Mono, monospace",
                    borderTop: "1px solid rgba(255,255,255,0.07)",
                    marginTop: 6,
                  }}
                >
                  {item.label}
                </div>
              );
            }
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => select(item.id)}
                style={{
                  width: "100%",
                  minHeight: 42,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 14px",
                  borderRadius: 18,
                  textAlign: "left",
                  cursor: "pointer",
                  border: "none",
                  background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
                  transition: "all .15s",
                }}
              >
                {item.icon}
                <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>
                {isActive && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: M.teal }} />}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "0 10px", marginTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16 }}>
          <div style={{ display: "flex", gap: 6, padding: "0 4px", marginBottom: 10 }}>
            <button
              onClick={() => onNavigate("home")}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                padding: "8px",
                minHeight: 36,
                borderRadius: 12,
                fontSize: 10,
                fontFamily: "DM Mono, monospace",
                cursor: "pointer",
                border: "none",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.45)",
              }}
            >
              <Home size={13} />
              Home
            </button>
            <button
              onClick={() => onNavigate("public")}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                padding: "8px",
                minHeight: 36,
                borderRadius: 12,
                fontSize: 10,
                fontFamily: "DM Mono, monospace",
                cursor: "pointer",
                border: "none",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.45)",
              }}
            >
              <Monitor size={13} />
              Public
            </button>
          </div>
          <div style={{ padding: "0 4px", marginBottom: 10, display: "flex", justifyContent: "center" }}>
            <ThemeSelector compact />
          </div>
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}

export function ProtectedAppShell({
  children,
  ...sidebarProps
}: ProtectedSidebarProps & { children: ReactNode }) {
  return (
    <div className="app-shell app-shell--protected">
      <ProtectedSidebar {...sidebarProps} />
      <main className="app-main">
        <div className="dashboard-container">{children}</div>
      </main>
    </div>
  );
}
