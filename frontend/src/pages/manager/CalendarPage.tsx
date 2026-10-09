import { CalendarModal } from "../../components/calendar/CalendarModal";

export function CalendarPage({ onClose }: { onClose: () => void }) {
  return <CalendarModal onClose={onClose} />;
}
