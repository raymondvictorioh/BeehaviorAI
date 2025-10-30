import { BehaviorLogEntry } from '../BehaviorLogEntry';

export default function BehaviorLogEntryExample() {
  return (
    <div className="p-4 max-w-2xl space-y-4">
      <BehaviorLogEntry
        id="1"
        date="October 28, 2025"
        category="Positive"
        notes="Helped a classmate understand a difficult math concept during group work."
        onView={() => console.log('View log details')}
      />
    </div>
  );
}
