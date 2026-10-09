import React from "react";
import { M } from "../../theme/tokens";
import { Play, Pause, LogOut } from "lucide-react";
import { MarquardtLogo } from "../common/Logo";

interface PresentationTopBarProps {
  isPaused: boolean;
  onTogglePause: () => void;
  slidesConfig: Array<{ id: string; label: string }>;
  currentSlideIndex: number;
  onSelectSection: (sectionId: string) => void;
  onExit: () => void;
}

export function PresentationTopBar({
  isPaused,
  onTogglePause,
  slidesConfig,
  currentSlideIndex,
  onSelectSection,
  onExit
}: PresentationTopBarProps) {
  return (
    <div style={{
      width: "100%",
      background: "var(--navbar-bg, #063A4D)",
      borderRadius: "1.5vh",
      padding: "1.5vh 2vw",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      boxShadow: "var(--shadow-md, 0 1vh 2vh rgba(0,0,0,0.2))",
      border: "1px solid var(--border, rgba(255,255,255,0.12))",
      marginBottom: "2vh",
      flexShrink: 0
    }}>
       
       {/* Left side: Logo and Description */}
       <div 
         onClick={onExit} 
         style={{ display: "flex", alignItems: "center", gap: "1vw", cursor: "pointer", transition: "opacity 0.2s" }}
         onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
         onMouseLeave={e => e.currentTarget.style.opacity = "1"}
         role="button"
         aria-label="Return to Dashboard Home"
       >
          <div style={{ borderRight: `2px solid rgba(255,255,255,0.2)`, paddingRight: "1vw" }}>
            <MarquardtLogo light height="3.2vh" />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
             <span style={{ fontSize: "1.6vh", fontWeight: 700, color: "#FFFFFF" }}>Public KPI Dashboard</span>
             <span style={{ fontSize: "1.4vh", color: "rgba(255,255,255,0.75)" }}>Live department overview</span>
          </div>
       </div>

       {/* Center: Presentation Controls */}
       <div style={{ display: "flex", alignItems: "center", gap: "2vw" }}>
          
          <button 
             onClick={onTogglePause}
             style={{ 
               background: isPaused ? M.success : "transparent", 
               border: `2px solid ${isPaused ? M.success : "#FFFFFF"}`,
               color: "#FFFFFF", 
               borderRadius: "1vh", 
               padding: "1vh 1.5vw", 
               cursor: "pointer", 
               display: "flex", 
               alignItems: "center", 
               gap: "0.5vw", 
               fontSize: "1.6vh", 
               fontWeight: 700,
               transition: "all 0.2s"
             }}
          >
             {isPaused ? <Play size="2vh" /> : <Pause size="2vh" />}
             {isPaused ? "RESUME" : "PAUSE"}
          </button>

          <div style={{ display: "flex", alignItems: "center", background: "rgba(0,0,0,0.3)", borderRadius: "1vh", padding: "0.5vh", border: "1px solid rgba(255,255,255,0.1)" }}>
             {slidesConfig.map((s, idx) => {
               const isActive = currentSlideIndex === idx;
               return (
                 <button
                   key={s.id}
                   onClick={() => onSelectSection(s.id)}
                   style={{
                      background: isActive ? "var(--primary, #00B8C2)" : "transparent",
                      color: isActive ? "var(--primary-foreground, #FFFFFF)" : "rgba(255,255,255,0.75)",
                      border: "none",
                      borderRadius: "0.5vh",
                      padding: "0.8vh 1vw",
                      cursor: "pointer",
                      fontSize: "1.4vh",
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

       {/* Right side: Department Selection */}
       <button
         onClick={onExit}
         style={{
            background: `linear-gradient(135deg, ${M.teal}, ${M.tealDeep})`,
            color: "#FFFFFF",
            border: "none",
            borderRadius: "1vh",
            padding: "1.2vh 2vw",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5vw",
            fontSize: "1.6vh",
            fontWeight: 800,
            textTransform: "uppercase",
            boxShadow: "0 0.5vh 1vh rgba(0,0,0,0.2)",
            transition: "transform 0.2s"
         }}
         onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
         onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
       >
          Dept Selection <LogOut size="1.8vh" />
       </button>

    </div>
  );
}
