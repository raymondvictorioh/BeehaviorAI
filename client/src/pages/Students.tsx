import { useState, useMemo } from "react";
import { StudentCard } from "@/components/StudentCard";
import { AddStudentDialog } from "@/components/AddStudentDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import type { Student, Class } from "@shared/schema";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";

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

  const { data: students = [], isLoading } = useQuery<(Student & { behaviorLogsCount: number; academicLogsCount: number })[]>({
    queryKey: ["/api/organizations", orgId, "students"],
    enabled: !!orgId,
  });

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/organizations", orgId, "classes"],
    enabled: !!orgId,
  });

  // Create a map of classId to className for quick lookup
  const classMap = useMemo(() => {
    const map = new Map<string, string>();
    classes.forEach((c) => {
      map.set(c.id, c.name);
    });
    return map;
  }, [classes]);

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <StudentsSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Students"
        description="Manage student profiles and behavior records"
        action={
          <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-student">
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        }
      />

      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search students..."
        testId="input-search-students"
      />

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
          {filteredStudents.map((student) => {
            const className = student.classId ? classMap.get(student.classId) || "" : "";
            return (
              <StudentCard
                key={student.id}
                id={student.id}
                name={student.name}
                email={student.email ?? ""}
                class={className}
                gender={student.gender ?? ""}
                behaviorLogsCount={student.behaviorLogsCount ?? 0}
                academicLogsCount={student.academicLogsCount ?? 0}
                lastActivity=""
                onClick={() => setLocation(`/students/${student.id}`)}
              />
            );
          })}
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
