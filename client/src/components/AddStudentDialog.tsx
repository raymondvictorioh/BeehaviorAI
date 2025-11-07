import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Student, Class } from "@shared/schema";

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  student?: Student | null;
}

export function AddStudentDialog({
  open,
  onOpenChange,
  organizationId,
  student,
}: AddStudentDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [classId, setClassId] = useState("__none__");
  const [gender, setGender] = useState("");
  const { toast } = useToast();
  const isEditMode = !!student;

  // Fetch active classes (not archived) for the organization
  const { data: classes = [], isLoading: isLoadingClasses } = useQuery<Class[]>({
    queryKey: ["/api/organizations", organizationId, "classes"],
    enabled: !!organizationId && open,
  });

  // Filter to only active (non-archived) classes
  const activeClasses = classes.filter(c => !c.isArchived);

  // Populate form when editing
  useEffect(() => {
    if (student && open) {
      setName(student.name || "");
      setEmail(student.email || "");
      setClassId(student.classId || "__none__");
      setGender(student.gender || "");
    } else if (!open) {
      // Reset form when dialog closes
      setName("");
      setEmail("");
      setClassId("__none__");
      setGender("");
    }
  }, [student, open]);

  const createStudent = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      classId: string | null;
      gender: string;
    }) => {
      const response = await fetch(`/api/organizations/${organizationId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create student");
      }
      return response.json();
    },
    // Optimistic update - immediately add student to UI
    onMutate: async (newStudent: { name: string; email: string; classId: string | null; gender: string }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", organizationId, "students"] });

      const previousStudents = queryClient.getQueryData<Student[]>([
        "/api/organizations",
        organizationId,
        "students",
      ]);

      const tempId = `temp-${Date.now()}`;
      const optimisticStudent: Student = {
        id: tempId,
        organizationId,
        name: newStudent.name,
        email: newStudent.email || null,
        classId: newStudent.classId || null,
        gender: newStudent.gender || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (previousStudents) {
        queryClient.setQueryData<Student[]>(
          ["/api/organizations", organizationId, "students"],
          [...previousStudents, optimisticStudent]
        );
      } else {
        queryClient.setQueryData<Student[]>(
          ["/api/organizations", organizationId, "students"],
          [optimisticStudent]
        );
      }

      // Close dialog and reset form immediately
      setName("");
      setEmail("");
      setClassId("__none__");
      setGender("");
      onOpenChange(false);

      return { previousStudents, tempId };
    },
    onSuccess: (data: Student, _variables, context) => {
      const previousStudents = queryClient.getQueryData<Student[]>([
        "/api/organizations",
        organizationId,
        "students",
      ]);

      if (previousStudents && context?.tempId) {
        queryClient.setQueryData<Student[]>(
          ["/api/organizations", organizationId, "students"],
          previousStudents.map((student) => (student.id === context.tempId ? data : student))
        );
      }

      toast({
        title: "Student added",
        description: "The student has been successfully added.",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousStudents) {
        queryClient.setQueryData<Student[]>(
          ["/api/organizations", organizationId, "students"],
          context.previousStudents
        );
      }
      // Reopen dialog on error
      onOpenChange(true);
      toast({
        title: "Error",
        description: error.message || "Failed to add student. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", organizationId, "students"] });
    },
  });

  const updateStudent = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      classId: string | null;
      gender: string;
    }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/organizations/${organizationId}/students/${student!.id}`,
        data
      );
      return await res.json();
    },
    // Optimistic update
    onMutate: async (updatedData: { name: string; email: string; classId: string | null; gender: string }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", organizationId, "students", student!.id] });
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", organizationId, "students"] });

      const previousStudent = queryClient.getQueryData<Student>([
        "/api/organizations",
        organizationId,
        "students",
        student!.id,
      ]);

      const previousStudents = queryClient.getQueryData<Student[]>([
        "/api/organizations",
        organizationId,
        "students",
      ]);

      // Optimistically update student
      if (previousStudent) {
        queryClient.setQueryData<Student>(
          ["/api/organizations", organizationId, "students", student!.id],
          { ...previousStudent, ...updatedData, updatedAt: new Date() }
        );
      }

      // Optimistically update students list
      if (previousStudents) {
        queryClient.setQueryData<Student[]>(
          ["/api/organizations", organizationId, "students"],
          previousStudents.map((s) => 
            s.id === student!.id 
              ? { ...s, ...updatedData, updatedAt: new Date() }
              : s
          )
        );
      }

      // Close dialog immediately
      onOpenChange(false);

      return { previousStudent, previousStudents };
    },
    onSuccess: (data: Student) => {
      // Update both single student and list queries
      queryClient.setQueryData<Student>(
        ["/api/organizations", organizationId, "students", student!.id],
        data
      );

      const previousStudents = queryClient.getQueryData<Student[]>([
        "/api/organizations",
        organizationId,
        "students",
      ]);

      if (previousStudents) {
        queryClient.setQueryData<Student[]>(
          ["/api/organizations", organizationId, "students"],
          previousStudents.map((s) => (s.id === student!.id ? data : s))
        );
      }

      toast({
        title: "Student updated",
        description: "The student has been successfully updated.",
      });
    },
    onError: (error: Error, _variables, context) => {
      // Revert optimistic updates
      if (context?.previousStudent) {
        queryClient.setQueryData<Student>(
          ["/api/organizations", organizationId, "students", student!.id],
          context.previousStudent
        );
      }
      if (context?.previousStudents) {
        queryClient.setQueryData<Student[]>(
          ["/api/organizations", organizationId, "students"],
          context.previousStudents
        );
      }
      // Reopen dialog on error
      onOpenChange(true);
      
      // Extract error message - handle both Error objects and string messages
      let errorMessage = "Failed to update student. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", organizationId, "students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", organizationId, "students", student!.id] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert special "no class" value to null
    const finalClassId = classId === "__none__" || !classId ? null : classId;
    
    if (isEditMode) {
      updateStudent.mutate({ name, email, classId: finalClassId, gender });
    } else {
      createStudent.mutate({ name, email, classId: finalClassId, gender });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid={isEditMode ? "dialog-edit-student" : "dialog-add-student"}>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Student" : "Add New Student"}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "Update the student's information." 
              : "Enter the student's information to create their profile."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                data-testid="input-student-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={!isEditMode}
                data-testid="input-student-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Select value={classId || "__none__"} onValueChange={setClassId} disabled={isLoadingClasses}>
                <SelectTrigger id="class" data-testid="select-student-class">
                  <SelectValue placeholder={isLoadingClasses ? "Loading classes..." : "Select a class"}>
                    {classId && classId !== "__none__" 
                      ? activeClasses.find(c => c.id === classId)?.name || "Select a class"
                      : "Select a class"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {activeClasses.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender} onValueChange={setGender} required={!isEditMode}>
                <SelectTrigger id="gender" data-testid="select-student-gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-student"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isEditMode ? updateStudent.isPending : createStudent.isPending}
              data-testid="button-submit-student"
            >
              {isEditMode 
                ? (updateStudent.isPending ? "Updating..." : "Update Student")
                : (createStudent.isPending ? "Adding..." : "Add Student")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
