import { useState } from "react";
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
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@shared/schema";

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

export function AddStudentDialog({
  open,
  onOpenChange,
  organizationId,
}: AddStudentDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [gender, setGender] = useState("");
  const { toast } = useToast();

  const createStudent = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      class: string;
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
    onMutate: async (newStudent: { name: string; email: string; class: string; gender: string }) => {
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
        class: newStudent.class || null,
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
      setStudentClass("");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createStudent.mutate({ name, email, class: studentClass, gender });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-add-student">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Enter the student's information to create their profile.
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
                required
                data-testid="input-student-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Input
                id="class"
                placeholder="Grade 10A"
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                required
                data-testid="input-student-class"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender} onValueChange={setGender} required>
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
              disabled={createStudent.isPending}
              data-testid="button-submit-student"
            >
              {createStudent.isPending ? "Adding..." : "Add Student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
