import { TaskItem } from '../TaskItem';

export default function TaskItemExample() {
  return (
    <div className="p-4 max-w-2xl space-y-4">
      <TaskItem
        id="1"
        title="Check in with Sarah about morning routine progress"
        dueDate="November 8, 2025"
        priority="medium"
        completed={false}
        onToggle={() => console.log('Toggle completed')}
        onEdit={() => console.log('Edit task')}
        onDelete={() => console.log('Delete task')}
      />
    </div>
  );
}
