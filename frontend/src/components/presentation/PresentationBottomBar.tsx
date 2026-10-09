import React from "react";
import { M } from "../../theme/tokens";
import { Play, Pause, LogOut } from "lucide-react";
import { MarquardtLogo } from "../common/Logo";
import { ThemeSelector } from "../common/ThemeSelector";

interface PresentationBottomBarProps {
  isPaused: boolean;
  onTogglePause: () => void;
  slidesConfig: Array<{ id: string; label: string; hideFromBottomBar?: boolean }>;
  currentSlideIndex: number;
  onSelectSection: (sectionId: string) => void;
  onExit: () => void;
  /** Navigate to the app home page (/) — used by the logo */
  onHome: () => void;
}

export function PresentationBottomBar({
  isPaused,
  onTogglePause,
  slidesConfig,
  currentSlideIndex,
  onSelectSection,
  onExit,
  onHome,
}: PresentationBottomBarProps) {
  return (
    <div style={{
      width: "100%",
      background: "var(--navbar-bg, #063A4D)",
      padding: "1.2vh 2vw",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderTop: `1px solid var(--border, rgba(255,255,255,0.12))`,
      boxSizing: "border-box",
      flexShrink: 0,
      gap: "1vw",
    }}>

      {/* Left side: Logo → Home */}
      <div
        onClick={onHome}
        style={{ display: "flex", alignItems: "center", cursor: "pointer", transition: "opacity 0.2s" }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        role="button"
        aria-label="Go to Home Page"
      >
        <MarquardtLogo light height="clamp(24px, 12vh, 70px)" clickable={true} />
      </div>

      {/* Center: Presentation Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.5vw" }}>

        <button
          onClick={onTogglePause}
          style={{
            background: isPaused ? M.success : "transparent",
            border: `2px solid ${isPaused ? M.success : "#FFFFFF"}`,
            color: "#FFFFFF",
            borderRadius: "1vh",
            padding: "0.8vh 1.2vw",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5vw",
            fontSize: "1.5vh",
            fontWeight: 700,
            transition: "all 0.2s"
          }}
        >
          {isPaused ? <Play size="1.8vh" /> : <Pause size="1.8vh" />}
          {isPaused ? "RESUME" : "PAUSE"}
        </button>

        <div style={{ display: "flex", alignItems: "center", background: "rgba(0,0,0,0.15)", borderRadius: "1vh", padding: "0.4vh", flexWrap: "wrap", justifyContent: "center", gap: "0.4vh", border: "1px solid rgba(255,255,255,0.2)" }}>
          {slidesConfig
            .filter(s => !s.hideFromBottomBar)
            .map(s => {
              const activeSlide = slidesConfig[currentSlideIndex];
              const isActive = activeSlide?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelectSection(s.id)}
                  style={{
                    background: isActive ? "#FFFFFF" : "transparent",
                    color: isActive ? "var(--primary, #008E95)" : "rgba(255,255,255,0.85)",
                    border: "none",
                    borderRadius: "0.5vh",
                    padding: "0.5vh 0.8vw",
                    cursor: "pointer",
                    fontSize: "1.35vh",
                    fontWeight: isActive ? 800 : 500,
                    transition: "all 0.2s"
                  }}
                >
                  {s.label}
                </button>
              );
            })}
        </div>

      </div>

      {/* Right side: ThemeSelector and Department Selection */}
      <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
        <ThemeSelector compact />
        <button
          onClick={onExit}
          style={{
            background: `linear-gradient(135deg, ${M.teal}, ${M.tealDeep})`,
            color: "#FFFFFF",
            border: "none",
            borderRadius: "1vh",
            padding: "0.8vh 1.2vw",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5vw",
            fontSize: "1.5vh",
            fontWeight: 800,
            textTransform: "uppercase",
            boxShadow: "0 0.5vh 1vh rgba(0,0,0,0.2)",
            transition: "transform 0.2s"
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
          Dept Selection <LogOut size="1.6vh" />
        </button>
      </div>

    </div>
  );
}
