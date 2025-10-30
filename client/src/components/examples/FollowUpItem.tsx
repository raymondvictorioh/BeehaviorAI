import { FollowUpItem } from '../FollowUpItem';

export default function FollowUpItemExample() {
  return (
    <div className="p-4 max-w-2xl space-y-4">
      <FollowUpItem
        id="1"
        title="Check in with Sarah about morning routine progress"
        dueDate="November 8, 2025"
        priority="medium"
        completed={false}
        onToggle={() => console.log('Toggle completed')}
        onEdit={() => console.log('Edit follow-up')}
        onDelete={() => console.log('Delete follow-up')}
      />
    </div>
  );
}
