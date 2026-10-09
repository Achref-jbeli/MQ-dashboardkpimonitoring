import React from "react";
import { M } from "../../theme/tokens";
import type { PublicEvent, PublicEmployee } from "../../api/publicDashboardApi";
import { Gift, Calendar, Eye, ClipboardCheck, CalendarDays, CloudSun } from "lucide-react";
import { getSeasonInfo } from "../../utils/seasonUtils";

interface PresentationSidebarProps {
  events: PublicEvent[];
  employees: PublicEmployee[];
  onSelectSection: (sectionId: string) => void;
}

export function PresentationSidebar({ events, employees, onSelectSection }: PresentationSidebarProps) {
  const today = new Date();
  const seasonInfo = getSeasonInfo(today);
  const mmdd = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const birthdays = employees.filter(e => e.birthDate && e.birthDate.slice(5, 10) === mmdd);
  
  // Filter events strictly for Visits, Audits, and Team Events
  const visitsEvents = events.filter(e => e.type?.toLowerCase() === "visits" || e.type?.toLowerCase() === "visit");
  const auditsEvents = events.filter(e => e.type?.toLowerCase() === "audits" || e.type?.toLowerCase() === "audit");
  const teamEvents = events.filter(e => 
    e.type?.toLowerCase() !== "visits" && 
    e.type?.toLowerCase() !== "visit" &&
    e.type?.toLowerCase() !== "audits" && 
    e.type?.toLowerCase() !== "audit" &&
    e.type?.toLowerCase() !== "birthday"
  );

  const getWeekNumber = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
  };

  const currentMonthName = today.toLocaleDateString("en-US", { month: "long" }).toUpperCase();

  const CardHeader = ({ icon, title, isDark = false }: { icon: React.ReactNode, title: string, isDark?: boolean }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "1vw", marginBottom: "0.5vh" }}>
      <div style={{ color: isDark ? "rgba(255,255,255,0.85)" : M.teal }}>
        {icon}
      </div>
      <h3 style={{ fontSize: "2.2vh", fontWeight: 700, margin: 0, color: isDark ? "#FFFFFF" : M.textPrimary }}>{title}</h3>
    </div>
  );

  const ClickableCard = ({ children, isDark, onClick, clickable }: { children: React.ReactNode, isDark?: boolean, onClick?: () => void, clickable: boolean }) => (
    <div 
       onClick={clickable ? onClick : undefined}
       style={{ 
         background: isDark ? "rgba(255,255,255,0.12)" : "var(--card, #FFFFFF)", 
         borderRadius: "1.5vh", 
         padding: "1.5vh 2vh", 
         flex: 1, 
         display: "flex", 
         flexDirection: "column",
         border: isDark ? "1px solid rgba(255,255,255,0.15)" : `1px solid ${M.border}`,
         cursor: clickable ? "pointer" : "default",
         transition: "transform 0.2s, opacity 0.2s",
       }}
       onMouseEnter={clickable ? e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.opacity = "0.9"; } : undefined}
       onMouseLeave={clickable ? e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.opacity = "1"; } : undefined}
       role={clickable ? "button" : undefined}
       aria-label={clickable ? "Go to section" : undefined}
    >
       {children}
    </div>
  );

  return (
    <div style={{ 
      width: "clamp(250px, 25vw, 400px)", 
      height: "100%", 
      background: "var(--sidebar, #08475E)",
      padding: "2vh 1.5vw", 
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      gap: "1.2vh",
      overflow: "hidden"
    }}>
      
      {/* Season Card */}
      <div style={{ 
        position: "relative",
        width: "100%", 
        height: "15vh", 
        background: `linear-gradient(135deg, ${M.teal}, ${M.tealDeep})`,
        borderRadius: "1.5vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        color: "#FFFFFF",
        flexShrink: 0,
        overflow: "hidden",
        boxShadow: "0 4px 18px rgba(0,0,0,0.25)",
        border: "1px solid rgba(255,255,255,0.18)",
      }}>
        <img 
          src={seasonInfo.image} 
          alt={`${seasonInfo.season} - ${currentMonthName}`}
          onError={(e) => {
            // If image fails to load, gracefully hide image and keep gradient background
            e.currentTarget.style.display = "none";
          }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            filter: "brightness(0.92)",
            transform: "scale(1.02)",
            transition: "transform 0.5s ease",
          }}
        />
        {/* Vignette / Contrast Overlay for Maximum Legibility */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(8, 71, 94, 0.3) 0%, rgba(5, 30, 42, 0.72) 100%)",
        }} />
        {/* Text Details */}
        <div style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "0 1vw",
        }}>
          <span style={{ 
            fontSize: "1.8vh", 
            fontWeight: 800, 
            letterSpacing: "0.12em",
            textShadow: "0 2px 8px rgba(0,0,0,0.7)",
            opacity: 0.95,
          }}>
            WELCOME
          </span>
          <span style={{ 
            fontSize: "3.4vh", 
            fontWeight: 900,
            letterSpacing: "0.02em",
            textShadow: "0 2px 12px rgba(0,0,0,0.85)",
            lineHeight: 1.15,
          }}>
            {currentMonthName}
          </span>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.2vh", overflowY: "auto", overflowX: "hidden" }}>
        
        {/* Birthdays (Light / Themed Card) */}
        <ClickableCard isDark={false} clickable={false}>
          <CardHeader icon={<Gift size={"2.5vh"} />} title="Birthdays" />
          <div style={{ flex: 1, overflow: "hidden" }}>
             {birthdays.slice(0,2).map(b => (
               <div key={b.id} style={{ fontSize: "1.6vh", color: M.textSec, marginTop: "0.5vh", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                 🎂 {b.firstName} {b.lastName}, {today.toLocaleDateString("en-US", {month:"short", day:"numeric"})}
               </div>
             ))}
             {birthdays.length === 0 && <div style={{ fontSize: "1.6vh", color: M.textSec, marginTop: "0.5vh" }}>No birthdays today</div>}
          </div>
        </ClickableCard>

        {/* Team Events (Dark) -> Clickable to Events */}
        <ClickableCard isDark={true} clickable={true} onClick={() => onSelectSection("events")}>
          <CardHeader icon={<Calendar size={"2.5vh"} />} title="Team Events" isDark />
          <div style={{ flex: 1, overflow: "hidden" }}>
             {teamEvents.slice(0,2).map(ev => (
               <div key={ev.id} style={{ fontSize: "1.6vh", color: "rgba(255,255,255,0.9)", marginTop: "0.5vh", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                 👥 {ev.title} - {ev.date ? new Date(ev.date).toLocaleDateString("en-US", {weekday:"short"}) : "TBD"}
               </div>
             ))}
             {teamEvents.length === 0 && <div style={{ fontSize: "1.6vh", color: "rgba(255,255,255,0.8)", marginTop: "0.5vh" }}>No upcoming team events</div>}
          </div>
        </ClickableCard>

        {/* Visits (Light / Themed Card) -> Clickable to Visits */}
        <ClickableCard isDark={false} clickable={true} onClick={() => onSelectSection("visits")}>
          <CardHeader icon={<Eye size={"2.5vh"} />} title="Visits !" />
          <div style={{ flex: 1, overflow: "hidden" }}>
             {visitsEvents.slice(0,2).map(ev => (
               <div key={ev.id} style={{ fontSize: "1.6vh", color: M.textSec, marginTop: "0.5vh", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                 💼 {ev.title} - {ev.date ? new Date(ev.date).toLocaleDateString("en-US", {weekday:"short"}) : "TBD"}
               </div>
             ))}
             {visitsEvents.length === 0 && <div style={{ fontSize: "1.6vh", color: M.textSec, marginTop: "0.5vh" }}>No visits scheduled</div>}
          </div>
        </ClickableCard>

        {/* Audits (Dark) -> Clickable to Audits */}
        <ClickableCard isDark={true} clickable={true} onClick={() => onSelectSection("audits")}>
          <CardHeader icon={<ClipboardCheck size={"2.5vh"} />} title="Audits" isDark />
          <div style={{ flex: 1, overflow: "hidden" }}>
             {auditsEvents.slice(0, 2).map(ev => (
               <div key={ev.id} style={{ fontSize: "1.6vh", color: "rgba(255,255,255,0.9)", marginTop: "0.5vh", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                 📋 {ev.title} - {ev.date ? new Date(ev.date).toLocaleDateString("en-US", {weekday:"short"}) : "TBD"}
               </div>
             ))}
             {auditsEvents.length === 0 && <div style={{ fontSize: "1.6vh", color: "rgba(255,255,255,0.85)", marginTop: "0.5vh" }}>No audits this week</div>}
          </div>
        </ClickableCard>

        {/* Calendar (Themed Card) -> Clickable to Calendar */}
        <ClickableCard isDark={false} clickable={true} onClick={() => onSelectSection("calendar")}>
          <CardHeader icon={<CalendarDays size={"2.5vh"} />} title="Calendar" />
          <div style={{ fontSize: "2vh", fontWeight: 800, color: M.textPrimary, marginTop: "0.5vh" }}>
             CW {getWeekNumber(today)}
          </div>
        </ClickableCard>

      </div>

      {/* Weather (Dark) - Pushed to bottom via layout */}
      <div style={{ marginTop: "auto" }}>
        <ClickableCard isDark={true} clickable={false}>
          <CardHeader icon={<CloudSun size={"2.5vh"} />} title="Weather" isDark />
          <div style={{ fontSize: "2.2vh", fontWeight: 800, color: "#FFFFFF", marginTop: "0.5vh", display: "flex", alignItems: "center", gap: "1vw" }}>
             <span>24° / 18°C</span>
             <span style={{ fontSize: "1.6vh", fontWeight: 400, color: "rgba(255,255,255,0.85)" }}>Sunny</span>
          </div>
        </ClickableCard>
      </div>

    </div>
  );
}
