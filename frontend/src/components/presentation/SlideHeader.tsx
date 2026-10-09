import React from "react";
import { M } from "../../theme/tokens";

export function SlideHeader({ title }: { title: string }) {
  return (
    <div style={{
      background: "var(--card, #FFFFFF)",
      padding: "1.8vh 4vw",
      borderRadius: "2vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "4vh",
      boxShadow: "var(--shadow, 0 2px 12px rgba(0,0,0,0.06))",
      border: `2px solid var(--primary, #00B8C2)`,
      borderLeft: `6px solid var(--primary, #00B8C2)`,
    }}>
      <h1 style={{
        fontSize: "4.5vh",
        fontWeight: 800,
        color: "var(--primary, #00B8C2)",
        margin: 0,
        letterSpacing: "0.05em",
        textTransform: "uppercase"
      }}>
        {title}
      </h1>
    </div>
  );
}
