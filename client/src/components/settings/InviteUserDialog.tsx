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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { email: string; role: string; message?: string }) => Promise<void>;
  isPending?: boolean;
}

export function InviteUserDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending = false,
}: InviteUserDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("teacher");
  const [message, setMessage] = useState("");

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setEmail("");
      setRole("teacher");
      setMessage("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      email,
      role,
      message: message.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Send an invitation to join your organization. They'll receive an email with
            a link to accept the invitation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                data-testid="input-invite-email"
              />
              <p className="text-xs text-muted-foreground">
                The user will receive an invitation email at this address
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger id="role" data-testid="select-invite-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Admin:</span> Full access to all features. {" "}
                <span className="font-medium">Teacher:</span> Can manage students and create logs. {" "}
                <span className="font-medium">Staff:</span> Read-only access.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message to the invitation email..."
                rows={3}
                maxLength={500}
                data-testid="textarea-invite-message"
              />
              <p className="text-xs text-muted-foreground">
                {message.length}/500 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !email.trim() || !role}
              data-testid="button-send-invitation"
            >
              {isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
