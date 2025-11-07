import { useState } from "react";
import { StudentCard } from "@/components/StudentCard";
import { AddStudentDialog } from "@/components/AddStudentDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import type { Student } from "@shared/schema";

// Skeleton loader for students page
function StudentsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>
      <div className="h-10 w-full bg-muted animate-pulse rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="h-48 bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function Students() {
  const [, setLocation] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const orgId = user?.organizations?.[0]?.id;

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/organizations", orgId, "students"],
    enabled: !!orgId,
  });

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <StudentsSkeleton />;
  }

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

      {filteredStudents.length === 0 && searchQuery === "" ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No students yet. Add your first student to get started.</p>
          <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-first-student">
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No students found matching "{searchQuery}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              id={student.id}
              name={student.name}
              email={student.email ?? ""}
              class={student.class ?? ""}
              gender={student.gender ?? ""}
              logsCount={0}
              lastActivity=""
              onClick={() => setLocation(`/students/${student.id}`)}
            />
          ))}
        </div>
      )}

      {orgId && (
        <AddStudentDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          organizationId={orgId}
        />
      )}
    </div>
  );
}
