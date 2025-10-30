import { useState } from "react";
import { StudentCard } from "@/components/StudentCard";
import { AddStudentDialog } from "@/components/AddStudentDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useLocation } from "wouter";

export default function Students() {
  const [, setLocation] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // todo: remove mock functionality
  const students = [
    {
      id: "1",
      name: "Sarah Johnson",
      email: "sarah.johnson@school.edu",
      class: "Grade 10A",
      gender: "female",
      logsCount: 5,
      lastActivity: "2 days ago",
    },
    {
      id: "2",
      name: "Michael Chen",
      email: "michael.chen@school.edu",
      class: "Grade 10A",
      gender: "male",
      logsCount: 3,
      lastActivity: "5 days ago",
    },
    {
      id: "3",
      name: "Emma Davis",
      email: "emma.davis@school.edu",
      class: "Grade 9B",
      gender: "female",
      logsCount: 8,
      lastActivity: "1 day ago",
    },
    {
      id: "4",
      name: "James Wilson",
      email: "james.wilson@school.edu",
      class: "Grade 11C",
      gender: "male",
      logsCount: 2,
      lastActivity: "1 week ago",
    },
    {
      id: "5",
      name: "Olivia Martinez",
      email: "olivia.martinez@school.edu",
      class: "Grade 10B",
      gender: "female",
      logsCount: 6,
      lastActivity: "3 days ago",
    },
    {
      id: "6",
      name: "Ethan Brown",
      email: "ethan.brown@school.edu",
      class: "Grade 9A",
      gender: "male",
      logsCount: 4,
      lastActivity: "4 days ago",
    },
  ];

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold mb-2" data-testid="text-page-title">
            Students
          </h1>
          <p className="text-muted-foreground">
            Manage student profiles and behavior records
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-student">
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-students"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => (
          <StudentCard
            key={student.id}
            {...student}
            onClick={() => setLocation(`/students/${student.id}`)}
          />
        ))}
      </div>

      <AddStudentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={(data) => console.log("New student:", data)}
      />
    </div>
  );
}
