import { useEffect, useState, useRef } from "react";
import { M } from "../../../theme/tokens";
import { SlideHeader } from "../SlideHeader";

const BASE = "http://localhost:5189";

export interface RealizationSlideProps {
  departmentId?: number;
  departmentName?: string;
}

export function RealizationSlide({ departmentName = "DEPARTMENT" }: RealizationSlideProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`${BASE}/api/photo/list/vave`)
      .then((r) => r.json())
      .then((d) => setPhotos(d.urls ?? []))
      .catch(() => setPhotos([]));
  }, []);

  // Auto-advance every 4 seconds
  useEffect(() => {
    if (photos.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % photos.length);
    }, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [photos.length]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <SlideHeader title="VAVE" />

      <div
        style={{
          flex: 1,
          background: "var(--card,#fff)",
          borderRadius: "2vh",
          boxShadow: "0 1vh 3vh rgba(0,0,0,0.15)",
          overflow: "hidden",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 0,
        }}
      >
        {photos.length === 0 ? (
          <div style={{ textAlign: "center", color: M.textSec }}>
            <p style={{ fontSize: "2.4vh", fontWeight: 600, color: M.textPrimary, margin: "0 0 0.8vh" }}>No photos yet</p>
            <p style={{ fontSize: "1.6vh", margin: 0 }}>Upload images in the VAVE section of the admin dashboard.</p>
          </div>
        ) : (
          <>
            <img
              key={index}
              src={`${BASE}${photos[index]}`}
              alt="VAVE"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
                animation: "fadeIn 0.6s ease",
              }}
            />
            {/* Dot indicators */}
            {photos.length > 1 && (
              <div style={{ position: "absolute", bottom: "1.5vh", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "0.6vh" }}>
                {photos.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setIndex(i)}
                    style={{
                      width: i === index ? "2.4vh" : "0.8vh",
                      height: "0.8vh",
                      borderRadius: "0.4vh",
                      background: i === index ? M.teal : "rgba(255,255,255,0.5)",
                      cursor: "pointer",
                      transition: "all 0.3s",
                      boxShadow: "0 0.2vh 0.6vh rgba(0,0,0,0.3)",
                    }}
                  />
                ))}
              </div>
            )}
            {/* Counter badge */}
            <div style={{ position: "absolute", top: "1.5vh", right: "1.5vh", background: "rgba(0,0,0,0.45)", color: "#fff", fontSize: "1.4vh", fontWeight: 700, padding: "0.4vh 1vh", borderRadius: "1vh" }}>
              {index + 1} / {photos.length}
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
}
