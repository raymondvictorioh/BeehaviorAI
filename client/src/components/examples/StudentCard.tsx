import { StudentCard } from '../StudentCard';

export default function StudentCardExample() {
  return (
    <div className="p-4 max-w-md">
      <StudentCard
        id="1"
        name="Sarah Johnson"
        email="sarah.johnson@school.edu"
        class="Grade 10A"
        gender="female"
        logsCount={5}
        lastActivity="2 days ago"
        onClick={() => console.log('Student card clicked')}
      />
    </div>
  );
}
