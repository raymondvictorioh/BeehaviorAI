import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";
import { useQuery } from "@tanstack/react-query";
import { insertTaskSchema, type Task, type User } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "./RichTextEditor";
import { StudentSelector } from "./StudentSelector";

interface OrganizationUser {
  userId: string;
  user: User;
  role: string;
}

const formSchema = insertTaskSchema.extend({
  title: z.string().min(1, "Title is required"),
  status: z.enum(["To-Do", "In-Progress", "Done", "Archived"]).default("To-Do"),
});

type FormData = z.infer<typeof formSchema>;

// Special value to represent "no assignee" - Radix UI Select doesn't allow empty strings
const NO_ASSIGNEE_VALUE = "__none__";

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => Promise<void>;
  isPending?: boolean;
  editTask?: Task | null;
  organizationId?: string;
  showStudentSelector?: boolean;
  preselectedStudentId?: string;
}

const statusOptions = [
  { value: "To-Do", label: "To-Do" },
  { value: "In-Progress", label: "In Progress" },
  { value: "Done", label: "Done" },
  { value: "Archived", label: "Archived" },
];

export function AddTaskDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending = false,
  editTask,
  organizationId,
  showStudentSelector = false,
  preselectedStudentId,
}: AddTaskDialogProps) {
  const [description, setDescription] = useState("");
  const isEditMode = !!editTask;

  // Use preselectedStudentId or editTask's studentId
  const effectiveStudentId = preselectedStudentId || editTask?.studentId;

  // Fetch organization users for assignee dropdown
  const { data: organizationUsers = [], isLoading: isLoadingUsers } = useQuery<OrganizationUser[]>({
    queryKey: ["/api/organizations", organizationId, "users"],
    enabled: !!organizationId && open,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "To-Do",
      assignee: NO_ASSIGNEE_VALUE,
      dueDate: undefined,
      organizationId: "",
      studentId: "",
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (editTask && open) {
      const descriptionValue = editTask.description || "";
      form.reset({
        title: editTask.title || "",
        description: descriptionValue,
        status: (editTask.status as "To-Do" | "In-Progress" | "Done" | "Archived") || "To-Do",
        assignee: editTask.assignee || NO_ASSIGNEE_VALUE,
        dueDate: editTask.dueDate ? new Date(editTask.dueDate) : undefined,
        organizationId: editTask.organizationId || "",
        studentId: editTask.studentId || "",
      });
      // Set description state - this will update the RichTextEditor via content prop
      setDescription(descriptionValue);
    } else if (!open) {
      // Reset form when dialog closes
      form.reset({
        title: "",
        description: "",
        status: "To-Do",
        assignee: NO_ASSIGNEE_VALUE,
        dueDate: undefined,
        organizationId: "",
        studentId: "",
      });
      setDescription("");
    }
  }, [editTask, open, form]);

  const handleSubmit = async (data: FormData) => {
    // Sanitize HTML description to prevent XSS attacks
    const sanitizedDescription = description ? DOMPurify.sanitize(description, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'input'],
      ALLOWED_ATTR: ['type', 'checked', 'data-type', 'data-checked'],
      ALLOWED_URI_REGEXP: /^$/
    }) : "";
    
    // Prepare submit data - remove empty fields and format dates
    const submitData: any = {
      title: data.title,
      description: sanitizedDescription || null,
      status: data.status || "To-Do",
      // Convert special "no assignee" value to null
      assignee: data.assignee === NO_ASSIGNEE_VALUE || !data.assignee ? null : data.assignee,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
    };
    
    // Remove fields with empty strings
    Object.keys(submitData).forEach(key => {
      if (submitData[key] === "" || submitData[key] === undefined) {
        submitData[key] = null;
      }
    });
    
    // Close dialog immediately for seamless UX (mutation handles optimistic updates)
    form.reset();
    setDescription("");
    onOpenChange(false);
    // Fire mutation after closing dialog so UI updates immediately
    onSubmit(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid={isEditMode ? "dialog-edit-task" : "dialog-add-task"}>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Task" : "Add Task"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {showStudentSelector && !effectiveStudentId && (
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student *</FormLabel>
                    <FormControl>
                      <StudentSelector
                        organizationId={organizationId || ""}
                        value={field.value}
                        onChange={field.onChange}
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter task title"
                      data-testid="input-task-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Description</FormLabel>
              <RichTextEditor
                content={description}
                onChange={setDescription}
                placeholder="Add detailed description..."
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignee"
                render={({ field }) => {
                  // Find selected user for display
                  const selectedUser = field.value && field.value !== NO_ASSIGNEE_VALUE
                    ? organizationUsers.find(ou => ou.userId === field.value)?.user
                    : null;
                  const selectedDisplayName = selectedUser
                    ? (selectedUser.firstName && selectedUser.lastName
                        ? `${selectedUser.firstName} ${selectedUser.lastName}`
                        : selectedUser.email || "Unknown User")
                    : "";
                  
                  return (
                    <FormItem>
                      <FormLabel>Assignee (Optional)</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || NO_ASSIGNEE_VALUE}
                        disabled={isLoadingUsers}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-assignee">
                            <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select assignee"}>
                              {selectedDisplayName || "Select assignee"}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NO_ASSIGNEE_VALUE}>None</SelectItem>
                          {organizationUsers.map((orgUser) => {
                            const user = orgUser.user;
                            const displayName = user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.email || "Unknown User";
                            const displayText = user.email && displayName !== user.email
                              ? `${displayName} (${user.email})`
                              : displayName;
                            
                            return (
                              <SelectItem key={orgUser.userId} value={orgUser.userId}>
                                {displayText}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={
                        field.value
                          ? new Date(field.value).toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : undefined;
                        field.onChange(date);
                      }}
                      data-testid="input-due-date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                data-testid="button-cancel-task"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit-task">
                {isPending ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Task" : "Create Task")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
