import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";
import { useQuery } from "@tanstack/react-query";
import { insertFollowUpSchema, type FollowUp, type User } from "@shared/schema";
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

interface OrganizationUser {
  userId: string;
  user: User;
  role: string;
}

const formSchema = insertFollowUpSchema.extend({
  title: z.string().min(1, "Title is required"),
  status: z.enum(["To-Do", "In-Progress", "Done", "Archived"]).default("To-Do"),
});

type FormData = z.infer<typeof formSchema>;

// Special value to represent "no assignee" - Radix UI Select doesn't allow empty strings
const NO_ASSIGNEE_VALUE = "__none__";

interface AddFollowUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => Promise<void>;
  isPending?: boolean;
  editFollowUp?: FollowUp | null;
  organizationId?: string;
}

const statusOptions = [
  { value: "To-Do", label: "To-Do" },
  { value: "In-Progress", label: "In Progress" },
  { value: "Done", label: "Done" },
  { value: "Archived", label: "Archived" },
];

export function AddFollowUpDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending = false,
  editFollowUp,
  organizationId,
}: AddFollowUpDialogProps) {
  const [description, setDescription] = useState("");
  const isEditMode = !!editFollowUp;

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
    if (editFollowUp && open) {
      const descriptionValue = editFollowUp.description || "";
      form.reset({
        title: editFollowUp.title || "",
        description: descriptionValue,
        status: (editFollowUp.status as "To-Do" | "In-Progress" | "Done" | "Archived") || "To-Do",
        assignee: editFollowUp.assignee || NO_ASSIGNEE_VALUE,
        dueDate: editFollowUp.dueDate ? new Date(editFollowUp.dueDate) : undefined,
        organizationId: editFollowUp.organizationId || "",
        studentId: editFollowUp.studentId || "",
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
  }, [editFollowUp, open, form]);

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid={isEditMode ? "dialog-edit-followup" : "dialog-add-followup"}>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Follow-Up" : "Add Follow-Up"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter follow-up title"
                      data-testid="input-followup-title"
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
                data-testid="button-cancel-followup"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit-followup">
                {isPending ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Follow-Up" : "Create Follow-Up")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
