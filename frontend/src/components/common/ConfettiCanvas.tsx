import { useMemo } from "react";
import { M } from "../../theme/tokens";

const CONFETTI_C = [M.teal, "#3B82F6", M.warning, M.success, M.danger, "#8B5CF6", "#FFD700", "#FF69B4"];

export function ConfettiCanvas() {
const pieces = useMemo(
() =>
    Array.from({ length: 72 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: CONFETTI_C[i % CONFETTI_C.length],
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 2,
    size: 6 + Math.random() * 9,
    isRect: Math.random() > 0.4,
    rotate: Math.random() * 360,
    })),
[]
);
return (
<div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
    {pieces.map((p) => (
    <div
        key={p.id}
        style={{
        position: "absolute",
        left: `${p.left}%`,
        top: "-20px",
        width: p.isRect ? `${p.size * 0.55}px` : `${p.size}px`,
        height: `${p.size}px`,
        backgroundColor: p.color,
        borderRadius: p.isRect ? "3px" : "50%",
        animation: `mqdConfetti ${p.duration}s ${p.delay}s ease-in infinite`,
        transform: `rotate(${p.rotate}deg)`,
        }}
    />
    ))}
</div>
);
}
