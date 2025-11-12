import { getLegacyBehaviorColor } from "@/lib/utils/colorUtils";
import { LogEntryCard } from "./shared/LogEntryCard";

interface BehaviorLogEntryProps {
  id: string;
  date: string;
  category: string;
  notes: string;
  onView?: () => void;
}

/**
 * BehaviorLogEntry - Behavior log card component
 *
 * Displays a single behavior log entry using the LogEntryCard template.
 * Uses legacy category color mapping for backward compatibility.
 */
export function BehaviorLogEntry({
  id,
  date,
  category,
  notes,
  onView,
}: BehaviorLogEntryProps) {
  const categoryColor = getLegacyBehaviorColor(category.toLowerCase());

  return (
    <LogEntryCard
      id={id}
      date={date}
      borderColor={categoryColor}
      primaryBadge={category}
      notes={notes}
      onView={onView}
      testIdPrefix="card-log"
    />
  );
}
