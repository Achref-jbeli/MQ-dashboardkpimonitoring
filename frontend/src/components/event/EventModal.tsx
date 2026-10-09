import { X } from "lucide-react";
import { M } from "../../theme/tokens";
import { EventForm, type EventFormValues } from "./EventForm";
import type { Event } from "../../types/event";

export function EventModal({
event,
onClose,
onSubmit,
}: {
event?: Event;
onClose: () => void;
onSubmit: (values: EventFormValues) => void;
}) {
return (
<div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
    <div style={{ position: "absolute", inset: 0, background: "rgba(7,44,70,0.6)", backdropFilter: "blur(12px)" }} onClick={onClose} />
    <div
    style={{
        position: "relative",
        width: "100%",
        maxWidth: 520,
        borderRadius: 24,
        padding: 28,
        background: M.white,
        boxShadow: "0 32px 80px rgba(0,0,0,0.25)",
    }}
    >
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: M.textPrimary, margin: 0 }}>{event ? "Edit Event" : "Add Event"}</h3>
        <button
        onClick={onClose}
        style={{ width: 28, height: 28, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: M.bgTeal, color: M.textSec, border: "none", cursor: "pointer" }}
        >
        <X size={14} />
        </button>
    </div>
    <EventForm initial={event} onCancel={onClose} onSubmit={onSubmit} />
    </div>
</div>
);
}
