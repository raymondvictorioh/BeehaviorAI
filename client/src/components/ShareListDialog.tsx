import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Search, X, Check } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

type ListShare = {
  id: string;
  listId: string;
  sharedWithUserId: string;
  sharedBy: string;
  sharedAt: Date;
};

interface ShareListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
  listName: string;
  existingShares: ListShare[];
  onShare: (userIds: string[]) => void;
  onUnshare: (userId: string) => void;
  isPending?: boolean;
}

export function ShareListDialog({
  open,
  onOpenChange,
  listId,
  listName,
  existingShares,
  onShare,
  onUnshare,
  isPending = false,
}: ShareListDialogProps) {
  const { user } = useAuth();
  const orgId = user?.organizations?.[0]?.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Fetch organization users
  const { data: orgUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/organizations", orgId, "users"],
    enabled: !!orgId && open,
  });

  // Get list of user IDs already shared with
  const sharedUserIds = useMemo(() => {
    return existingShares.map((share) => share.sharedWithUserId);
  }, [existingShares]);

  // Filter out current user and already-shared users
  const availableUsers = useMemo(() => {
    return orgUsers
      .filter((u) => u.id !== user?.id) // Don't show current user
      .filter((u) => !sharedUserIds.includes(u.id)) // Don't show already-shared users
      .filter((u) => {
        const searchLower = searchQuery.toLowerCase();
        const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
        return (
          u.email.toLowerCase().includes(searchLower) ||
          fullName.includes(searchLower)
        );
      });
  }, [orgUsers, user?.id, sharedUserIds, searchQuery]);

  // Get shared users with full details
  const sharedUsers = useMemo(() => {
    return existingShares.map((share) => {
      const sharedUser = orgUsers.find((u) => u.id === share.sharedWithUserId);
      return {
        ...share,
        user: sharedUser,
      };
    });
  }, [existingShares, orgUsers]);

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleShare = () => {
    onShare(selectedUserIds);
    setSelectedUserIds([]);
    setSearchQuery("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedUserIds([]);
      setSearchQuery("");
    }
    onOpenChange(newOpen);
  };

  const getUserDisplay = (user: User) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.email;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Share "{listName}"</DialogTitle>
          <DialogDescription>
            Share this list with other users in your organization. They will be able to view the list
            but only you can edit or delete it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Currently shared with */}
          {sharedUsers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Currently Shared With</h4>
              <div className="space-y-2">
                {sharedUsers.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted"
                  >
                    <div>
                      <p className="font-medium">
                        {share.user ? getUserDisplay(share.user) : "Unknown User"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {share.user?.email || ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onUnshare(share.sharedWithUserId)}
                      disabled={isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add more users */}
          <div>
            <h4 className="text-sm font-medium mb-2">Share With More Users</h4>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[250px] pr-4">
              {availableUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground text-sm">
                    {searchQuery
                      ? "No users found matching your search"
                      : sharedUserIds.length === orgUsers.length - 1
                      ? "This list is already shared with all users"
                      : "No other users available to share with"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => handleToggleUser(user.id)}
                    >
                      <Checkbox
                        checked={selectedUserIds.includes(user.id)}
                        onCheckedChange={() => handleToggleUser(user.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{getUserDisplay(user)}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Close
          </Button>
          <Button
            onClick={handleShare}
            disabled={selectedUserIds.length === 0 || isPending}
          >
            {isPending
              ? "Sharing..."
              : `Share with ${selectedUserIds.length} User${selectedUserIds.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
