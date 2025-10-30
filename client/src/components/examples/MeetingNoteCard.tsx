import { MeetingNoteCard } from '../MeetingNoteCard';

export default function MeetingNoteCardExample() {
  return (
    <div className="p-4 max-w-2xl">
      <MeetingNoteCard
        id="1"
        date="October 25, 2025"
        participants={["Mrs. Johnson (Parent)", "Mr. Smith (Teacher)"]}
        summary="Discussed Sarah's recent tardiness and academic progress. Parent committed to ensuring better morning routine."
        fullNotes="Meeting started at 3:00 PM. Mrs. Johnson was concerned about recent behavior changes. We discussed Sarah's academic performance, which remains strong. The tardiness issue was addressed, and Mrs. Johnson explained there have been some family circumstances affecting morning routines. We agreed on a plan to improve punctuality with check-ins every two weeks."
        onEdit={() => console.log('Edit meeting note')}
        onDelete={() => console.log('Delete meeting note')}
      />
    </div>
  );
}
