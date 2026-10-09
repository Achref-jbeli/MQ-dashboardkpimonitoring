import { useState, useEffect } from "react";
import { Button } from "../../components/common/Button";
import { SearchInput } from "../../components/common/SearchInput";
import { EventTable } from "../../components/event/EventTable";
import { EventModal } from "../../components/event/EventModal";
import type { EventFormValues } from "../../components/event/EventForm";
import type { Event } from "../../types/event";
import { getEvents, createEvent, updateEvent, deleteEvent } from "../../api/eventApi";
import { M } from "../../theme/tokens";
import { Calendar, Eye, ClipboardCheck, Sparkles } from "lucide-react";

export function EventsPage({
  initialFilter = "events",
  departmentId,
}: {
  initialFilter?: "events" | "visits" | "audits" | "all";
  departmentId?: number | null;
}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Event | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<"events" | "visits" | "audits" | "all">(initialFilter);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await getEvents();
      setEvents(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const filtered = events.filter((e) => {
    const normType = (e.type ?? "").toLowerCase();

    if (filterTab === "events") {
      if (
        normType === "birthday" ||
        normType === "visit" ||
        normType === "visits" ||
        normType === "audit" ||
        normType === "audits"
      ) {
        return false;
      }
    } else if (filterTab === "visits") {
      if (normType !== "visit" && normType !== "visits") {
        return false;
      }
    } else if (filterTab === "audits") {
      if (normType !== "audit" && normType !== "audits") {
        return false;
      }
    }

    const query = search.toLowerCase();
    return (
      e.title.toLowerCase().includes(query) ||
      (e.location ?? "").toLowerCase().includes(query) ||
      (e.type ?? "").toLowerCase().includes(query)
    );
  });

  const handleSubmit = async (values: EventFormValues) => {
    const eventData = {
      title: values.title,
      description: values.description,
      date: values.date || undefined,
      location: values.location,
      type: values.type,
      imageUrl: values.imageUrl,
      employeeId: values.employeeId,
      departmentId: departmentId ?? undefined,
    };
    try {
      if (editing) {
        const updated = await updateEvent(editing.id, eventData);
        setEvents((prev) => prev.map((e) => (e.id === editing.id ? updated : e)));
      } else {
        const created = await createEvent(eventData);
        setEvents((prev) => [...prev, created]);
      }
      setShowModal(false);
      setEditing(null);
    } catch (error) {
      console.error("Error saving event:", error);
      setError("Failed to save event.");
    }
  };

  const handleDelete = async (event: Event) => {
    if (!confirm(`Delete event "${event.title}"?`)) return;
    try {
      await deleteEvent(event.id);
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
    } catch (error) {
      console.error("Error deleting event:", error);
      setError("Failed to delete event.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Filter Tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {[
          { id: "events", label: "Team Events", icon: <Sparkles size={14} /> },
          { id: "visits", label: "Visits", icon: <Eye size={14} /> },
          { id: "audits", label: "Audits", icon: <ClipboardCheck size={14} /> },
          { id: "all", label: "All Items", icon: <Calendar size={14} /> },
        ].map((tab) => {
          const isActive = filterTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                border: `1px solid ${isActive ? "var(--primary, #00B8C2)" : M.border}`,
                background: isActive ? "var(--primary, #00B8C2)" : "var(--card, #FFFFFF)",
                color: isActive ? "var(--primary-foreground, #FFFFFF)" : M.textPrimary,
                transition: "all 0.2s",
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search events..." />
        <Button
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
        >
          + Add Item
        </Button>
      </div>
      {error && <p style={{ color: "#B91C1C", fontSize: 12, margin: 0 }}>{error}</p>}
      {loading ? (
        <p style={{ fontSize: 13, color: M.textSec }}>Loading events...</p>
      ) : (
        <EventTable
          events={filtered}
          onEdit={(event) => {
            setEditing(event);
            setShowModal(true);
          }}
          onDelete={handleDelete}
        />
      )}
      {showModal && (
        <EventModal
          event={editing ?? undefined}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
