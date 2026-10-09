import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { PublicDepartmentDashboard, PublicInternationalBusiness, PublicEmployee } from "../../api/publicDashboardApi";
import type { BusinessUnitDashboard } from "../../api/dashboardApi";
import { PresentationSidebar } from "./PresentationSidebar";
import { PresentationBottomBar } from "./PresentationBottomBar";
import { BirthdayOverlay } from "../common/BirthdayOverlay";

// Import Slides
import { CombinedMaturitySlide } from "./slides/CombinedMaturitySlide";
import { RealizationSlide } from "./slides/RealizationSlide";
import { MilestonesSlide } from "./slides/MilestonesSlide";
import { PerformanceSlide } from "./slides/PerformanceSlide";
import { AdherenceSlide } from "./slides/AdherenceSlide";
import { ProjectOverviewSlide } from "./slides/ProjectOverviewSlide";
import { NewBusinessSlide } from "./slides/NewBusinessSlide";
import { EventsSlide } from "./slides/EventsSlide";
import { CalendarSlide } from "./slides/CalendarSlide";

export interface PresentationLoopProps {
  dashboardData: PublicDepartmentDashboard;
  buDashboards: BusinessUnitDashboard[];
  newBusiness: PublicInternationalBusiness[];
  onExit: () => void;
}

const DEFAULT_SLIDE_DURATION_MS = 5000;

/** Returns employees whose birthday is today (ignores year). */
function getTodaysBirthdays(employees: PublicEmployee[]): PublicEmployee[] {
  const today = new Date();
  const mm = today.getMonth() + 1;
  const dd = today.getDate();
  return employees.filter((emp) => {
    if (!emp.birthDate) return false;
    const d = new Date(emp.birthDate);
    return d.getMonth() + 1 === mm && d.getDate() === dd;
  });
}

export function PresentationLoop({ dashboardData, buDashboards, newBusiness, onExit }: PresentationLoopProps) {
  const navigate = useNavigate();

  const hmiData = buDashboards.find(bu => bu.name === "HMI");
  const hisData = buDashboards.find(bu => bu.name === "HIS");

  const allEvents = dashboardData.events || [];

  // Strict Event Type Filtering
  const generalEvents = allEvents.filter(
    (e) =>
      e.type?.toLowerCase() !== "birthday" &&
      e.type?.toLowerCase() !== "visit" &&
      e.type?.toLowerCase() !== "visits" &&
      e.type?.toLowerCase() !== "audit" &&
      e.type?.toLowerCase() !== "audits"
  );

  const visitsEvents = allEvents.filter(
    (e) => e.type?.toLowerCase() === "visit" || e.type?.toLowerCase() === "visits"
  );

  const auditsEvents = allEvents.filter(
    (e) => e.type?.toLowerCase() === "audit" || e.type?.toLowerCase() === "audits"
  );

  // Centralized Configuration — Calendar hidden from bottom bar (it's in sidebar)
  const slidesConfig = [
    { id: "business",       label: "RFQs",            duration: DEFAULT_SLIDE_DURATION_MS, component: <NewBusinessSlide newBusiness={newBusiness} /> },
    { id: "realization",    label: "VAVE",             duration: DEFAULT_SLIDE_DURATION_MS, component: <RealizationSlide departmentId={dashboardData.department.id} departmentName={dashboardData.department.name} /> },
    { id: "hmi-his",        label: "Maturity",         duration: DEFAULT_SLIDE_DURATION_MS, component: <CombinedMaturitySlide hmiData={hmiData} hisData={hisData} departmentId={dashboardData.department.id} departmentName={dashboardData.department.name} /> },
    { id: "adherence", label: "Adherence", duration: DEFAULT_SLIDE_DURATION_MS, component: <AdherenceSlide buDashboards={buDashboards} /> },
    { id: "milestones",     label: "PEP Milestones",   duration: DEFAULT_SLIDE_DURATION_MS, component: <MilestonesSlide departmentId={dashboardData.department.id} departmentName={dashboardData.department.name} /> },
    { id: "events",         label: "Events",           duration: DEFAULT_SLIDE_DURATION_MS, component: <EventsSlide events={generalEvents} title="UPCOMING EVENTS" emptyMessage="No general team events scheduled." /> },
    { id: "visits",  label: "Visits",  duration: DEFAULT_SLIDE_DURATION_MS, hideFromBottomBar: true, component: <EventsSlide events={visitsEvents} title="UPCOMING VISITS"  emptyMessage="No visits scheduled." centred={false} /> },
    { id: "audits",  label: "Audits",  duration: DEFAULT_SLIDE_DURATION_MS, hideFromBottomBar: true, component: <EventsSlide events={auditsEvents} title="UPCOMING AUDITS"  emptyMessage="No audits scheduled this period." centred={false} /> },
  ].filter(s => s.component !== null);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [fadeState, setFadeState] = useState<"in" | "out">("in");

  // Birthday overlay state
  const todayBirthdays = getTodaysBirthdays(dashboardData.employees ?? []);
  const birthdayQueueRef = useRef<PublicEmployee[]>([]);
  const [activeBirthday, setActiveBirthday] = useState<PublicEmployee | null>(null);
  const birthdayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeSlide = slidesConfig[currentSlideIndex];

  // Helper to advance slide manually or automatically
  const advanceSlide = (nextIndex: number) => {
    setFadeState("out");
    if (transitionRef.current) clearTimeout(transitionRef.current);

    transitionRef.current = setTimeout(() => {
      setCurrentSlideIndex(nextIndex);
      setFadeState("in");
    }, 400); // crossfade duration
  };

  const handleManualSelection = (sectionId: string) => {
    const idx = slidesConfig.findIndex(s => s.id === sectionId);
    if (idx !== -1 && idx !== currentSlideIndex) {
      advanceSlide(idx);
    }
  };

  /** Show birthday overlay for 3s, then dismiss. */
  const showNextBirthday = () => {
    if (birthdayQueueRef.current.length === 0) return;
    const emp = birthdayQueueRef.current.shift()!;
    setActiveBirthday(emp);

    if (birthdayTimerRef.current) clearTimeout(birthdayTimerRef.current);
    birthdayTimerRef.current = setTimeout(() => {
      setActiveBirthday(null);
    }, 3000);
  };

  // Main Loop Effect — also triggers birthday overlay on each loop wrap
  useEffect(() => {
    if (isPaused || slidesConfig.length <= 1) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const duration = activeSlide?.duration || DEFAULT_SLIDE_DURATION_MS;

    timerRef.current = setTimeout(() => {
      const nextIdx = (currentSlideIndex + 1) % slidesConfig.length;

      // Loop completed — refill birthday queue and fire first overlay
      if (nextIdx === 0 && todayBirthdays.length > 0) {
        birthdayQueueRef.current = [...todayBirthdays];
        showNextBirthday();
      }

      advanceSlide(nextIdx);
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentSlideIndex, isPaused, slidesConfig.length, activeSlide?.duration]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        advanceSlide((currentSlideIndex + 1) % slidesConfig.length);
      } else if (e.key === "ArrowLeft") {
        advanceSlide((currentSlideIndex - 1 + slidesConfig.length) % slidesConfig.length);
      } else if (e.key === " ") {
        setIsPaused(p => !p);
      } else if (e.key === "Escape") {
        onExit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlideIndex, slidesConfig.length, onExit]);

  // Cleanup birthday timer on unmount
  useEffect(() => {
    return () => {
      if (birthdayTimerRef.current) clearTimeout(birthdayTimerRef.current);
    };
  }, []);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      width: "100vw",
      height: "100vh",
      background: "var(--background, #08475E)",
      display: "flex",
      flexDirection: "row",
      overflow: "hidden",
      zIndex: 9999,
      fontFamily: "Inter, sans-serif"
    }}>

      {/* 1. Left Lateral Live Sidebar */}
      <PresentationSidebar
        events={dashboardData.events}
        employees={dashboardData.employees}
        onSelectSection={handleManualSelection}
      />

      {/* 2. Main Presentation Area */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minWidth: 0,
        position: "relative"
      }}>

        {/* Slide Viewport with Crossfade */}
        <div style={{
          flex: 1,
          padding: "2.5vh 2.5vw 1.5vh 2.5vw",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
          opacity: fadeState === "in" ? 1 : 0,
          transition: "opacity 0.4s ease-in-out"
        }}>
          {activeSlide?.component}
        </div>

        {/* 3. Bottom Navigation & Remote Controls */}
        <PresentationBottomBar
          isPaused={isPaused}
          onTogglePause={() => setIsPaused(p => !p)}
          slidesConfig={slidesConfig}
          currentSlideIndex={currentSlideIndex}
          onSelectSection={handleManualSelection}
          onExit={onExit}
          onHome={() => navigate("/")}
        />

      </div>

      {/* 4. Birthday Overlay — pops for 3 s on each loop */}
      {activeBirthday && (
        <BirthdayOverlay
          emp={activeBirthday as any}
          onClose={() => {
            setActiveBirthday(null);
            if (birthdayTimerRef.current) clearTimeout(birthdayTimerRef.current);
          }}
        />
      )}

    </div>
  );
}
