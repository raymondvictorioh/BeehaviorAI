import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useRoute, useLocation } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, Plus, Share2, Trash2, Edit, Users, ClipboardList, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { AddItemsToListDialog } from "@/components/AddItemsToListDialog";
import { ShareListDialog } from "@/components/ShareListDialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ListType = "students" | "behavior_logs" | "academic_logs";

type List = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  type: ListType;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

type Student = {
  id: string;
  name: string;
  email: string | null;
  classId: string | null;
};

type BehaviorLog = {
  id: string;
  incidentDate: Date;
  studentId: string;
  categoryId: string;
  notes: string;
  student?: { name: string };
  category?: { name: string; color: string | null };
};

type AcademicLog = {
  id: string;
  assessmentDate: Date;
  studentId: string;
  subjectId: string;
  categoryId: string;
  grade: string | null;
  score: string | null;
  notes: string;
  student?: { name: string };
  subject?: { name: string };
  category?: { name: string; color: string | null };
};

type ListItem = {
  id: string;
  listId: string;
  studentId: string | null;
  behaviorLogId: string | null;
  academicLogId: string | null;
  addedBy: string;
  addedAt: Date;
  notes: string | null;
  // Populated based on type
  student?: Student;
  behaviorLog?: BehaviorLog;
  academicLog?: AcademicLog;
};

type ListShare = {
  id: string;
  listId: string;
  sharedWithUserId: string;
  sharedBy: string;
  sharedAt: Date;
};

export default function ListDetail() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute("/lists/:id");
  const [, setLocation] = useLocation();
  const orgId = user?.organizations?.[0]?.id;
  const listId = params?.id;

  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isAddItemsDialogOpen, setIsAddItemsDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  // Fetch list details
  const { data: list, isLoading: listLoading } = useQuery<List>({
    queryKey: ["/api/organizations", orgId, "lists", listId],
    enabled: !!orgId && !!listId,
  });

  // Fetch list items
  const { data: items = [], isLoading: itemsLoading } = useQuery<ListItem[]>({
    queryKey: ["/api/organizations", orgId, "lists", listId, "items"],
    enabled: !!orgId && !!listId,
  });

  const isOwner = list?.createdBy === user?.email;

  // Fetch list shares
  const { data: shares = [] } = useQuery<ListShare[]>({
    queryKey: ["/api/organizations", orgId, "lists", listId, "shares"],
    enabled: !!orgId && !!listId && isOwner,
  });

  // Delete item mutation
  const deleteItem = useMutation({
    mutationFn: async (itemId: string) => {
      await apiRequest("DELETE", `/api/organizations/${orgId}/lists/${listId}/items/${itemId}`);
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({
        queryKey: ["/api/organizations", orgId, "lists", listId, "items"],
      });
      const previousItems = queryClient.getQueryData([
        "/api/organizations",
        orgId,
        "lists",
        listId,
        "items",
      ]);

      queryClient.setQueryData(
        ["/api/organizations", orgId, "lists", listId, "items"],
        (old: any[]) => old.filter((item) => item.id !== itemId)
      );

      setDeleteItemId(null);

      return { previousItems };
    },
    onSuccess: () => {
      toast({
        title: "Item removed",
        description: "The item has been removed from this list.",
      });
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(
        ["/api/organizations", orgId, "lists", listId, "items"],
        context?.previousItems
      );
      toast({
        title: "Failed to remove",
        description: "Could not remove the item. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/organizations", orgId, "lists", listId, "items"],
      });
    },
  });

  // Add items mutation
  const addItems = useMutation({
    mutationFn: async (itemIds: string[]) => {
      const promises = itemIds.map((itemId) => {
        const itemData: any = { listId };
        if (list?.type === "students") {
          itemData.studentId = itemId;
        } else if (list?.type === "behavior_logs") {
          itemData.behaviorLogId = itemId;
        } else if (list?.type === "academic_logs") {
          itemData.academicLogId = itemId;
        }
        return apiRequest("POST", `/api/organizations/${orgId}/lists/${listId}/items`, itemData);
      });
      const results = await Promise.all(promises);
      return await Promise.all(results.map((res) => res.json()));
    },
    onMutate: async () => {
      setIsAddItemsDialogOpen(false);
    },
    onSuccess: (newItems) => {
      toast({
        title: "Items added",
        description: `Successfully added ${newItems.length} item${newItems.length !== 1 ? "s" : ""} to the list.`,
      });
    },
    onError: (_error) => {
      setIsAddItemsDialogOpen(true);
      toast({
        title: "Failed to add items",
        description: "Could not add some items to the list. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/organizations", orgId, "lists", listId, "items"],
      });
    },
  });

  // Share list mutation
  const shareList = useMutation({
    mutationFn: async (userIds: string[]) => {
      const promises = userIds.map((userId) =>
        apiRequest("POST", `/api/organizations/${orgId}/lists/${listId}/shares`, {
          sharedWithUserId: userId,
        })
      );
      const results = await Promise.all(promises);
      return await Promise.all(results.map((res) => res.json()));
    },
    onMutate: async () => {
      setIsShareDialogOpen(false);
    },
    onSuccess: (newShares) => {
      toast({
        title: "List shared",
        description: `Successfully shared with ${newShares.length} user${newShares.length !== 1 ? "s" : ""}.`,
      });
    },
    onError: (_error) => {
      setIsShareDialogOpen(true);
      toast({
        title: "Failed to share",
        description: "Could not share the list. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/organizations", orgId, "lists", listId, "shares"],
      });
    },
  });

  // Unshare list mutation
  const unshareList = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/organizations/${orgId}/lists/${listId}/shares/${userId}`);
    },
    onMutate: async (userId) => {
      await queryClient.cancelQueries({
        queryKey: ["/api/organizations", orgId, "lists", listId, "shares"],
      });
      const previousShares = queryClient.getQueryData([
        "/api/organizations",
        orgId,
        "lists",
        listId,
        "shares",
      ]);

      queryClient.setQueryData(
        ["/api/organizations", orgId, "lists", listId, "shares"],
        (old: any[]) => old.filter((share) => share.sharedWithUserId !== userId)
      );

      return { previousShares };
    },
    onSuccess: () => {
      toast({
        title: "Access removed",
        description: "User no longer has access to this list.",
      });
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(
        ["/api/organizations", orgId, "lists", listId, "shares"],
        context?.previousShares
      );
      toast({
        title: "Failed to remove access",
        description: "Could not remove user access. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/organizations", orgId, "lists", listId, "shares"],
      });
    },
  });

  // Generate columns based on list type
  const columns = useMemo<ColumnDef<ListItem>[]>(() => {
    if (!list) return [];

    const baseColumns: ColumnDef<ListItem>[] = [];

    if (list.type === "students") {
      baseColumns.push(
        {
          accessorKey: "student.name",
          id: "name",
          header: "Student Name",
          cell: ({ row }) => row.original.student?.name || "Unknown",
        },
        {
          accessorKey: "student.email",
          id: "email",
          header: "Email",
          cell: ({ row }) => row.original.student?.email || "—",
        }
      );
    } else if (list.type === "behavior_logs") {
      baseColumns.push(
        {
          accessorKey: "behaviorLog.incidentDate",
          id: "incidentDate",
          header: "Date",
          cell: ({ row }) =>
            row.original.behaviorLog?.incidentDate
              ? format(new Date(row.original.behaviorLog.incidentDate), "MMM d, yyyy")
              : "—",
        },
        {
          accessorKey: "behaviorLog.student.name",
          id: "studentName",
          header: "Student",
          cell: ({ row }) => row.original.behaviorLog?.student?.name || "Unknown",
        },
        {
          accessorKey: "behaviorLog.category.name",
          id: "category",
          header: "Category",
          cell: ({ row }) => {
            const category = row.original.behaviorLog?.category;
            if (!category) return "—";
            return (
              <Badge
                variant="secondary"
                className={category.color ? `bg-${category.color}-100 text-${category.color}-800` : ""}
              >
                {category.name}
              </Badge>
            );
          },
        },
        {
          accessorKey: "behaviorLog.notes",
          id: "notes",
          header: "Notes",
          cell: ({ row }) => {
            const notes = row.original.behaviorLog?.notes || "";
            return notes.length > 50 ? `${notes.substring(0, 50)}...` : notes;
          },
        }
      );
    } else if (list.type === "academic_logs") {
      baseColumns.push(
        {
          accessorKey: "academicLog.assessmentDate",
          id: "assessmentDate",
          header: "Date",
          cell: ({ row }) =>
            row.original.academicLog?.assessmentDate
              ? format(new Date(row.original.academicLog.assessmentDate), "MMM d, yyyy")
              : "—",
        },
        {
          accessorKey: "academicLog.student.name",
          id: "studentName",
          header: "Student",
          cell: ({ row }) => row.original.academicLog?.student?.name || "Unknown",
        },
        {
          accessorKey: "academicLog.subject.name",
          id: "subject",
          header: "Subject",
          cell: ({ row }) => row.original.academicLog?.subject?.name || "Unknown",
        },
        {
          accessorKey: "academicLog.category.name",
          id: "category",
          header: "Category",
          cell: ({ row }) => {
            const category = row.original.academicLog?.category;
            if (!category) return "—";
            return (
              <Badge
                variant="secondary"
                className={category.color ? `bg-${category.color}-100 text-${category.color}-800` : ""}
              >
                {category.name}
              </Badge>
            );
          },
        },
        {
          accessorKey: "academicLog.grade",
          id: "grade",
          header: "Grade",
          cell: ({ row }) => row.original.academicLog?.grade || "—",
        },
        {
          accessorKey: "academicLog.score",
          id: "score",
          header: "Score",
          cell: ({ row }) => row.original.academicLog?.score || "—",
        }
      );
    }

    // Add common columns
    baseColumns.push(
      {
        accessorKey: "addedBy",
        id: "addedBy",
        header: "Added By",
      },
      {
        accessorKey: "addedAt",
        id: "addedAt",
        header: "Added At",
        cell: ({ row }) => format(new Date(row.original.addedAt), "MMM d, yyyy"),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteItemId(row.original.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      }
    );

    return baseColumns;
  }, [list]);

  const getListTypeIcon = (type: ListType) => {
    switch (type) {
      case "students":
        return <Users className="h-5 w-5" />;
      case "behavior_logs":
        return <ClipboardList className="h-5 w-5" />;
      case "academic_logs":
        return <BookOpen className="h-5 w-5" />;
    }
  };

  const getListTypeLabel = (type: ListType) => {
    switch (type) {
      case "students":
        return "Students";
      case "behavior_logs":
        return "Behavior Logs";
      case "academic_logs":
        return "Academic Logs";
    }
  };

  const handleDeleteItem = (itemId: string) => {
    deleteItem.mutate(itemId);
  };

  const handleAddItems = (selectedIds: string[]) => {
    addItems.mutate(selectedIds);
  };

  const handleShare = (userIds: string[]) => {
    shareList.mutate(userIds);
  };

  const handleUnshare = (userId: string) => {
    unshareList.mutate(userId);
  };

  // Get existing item IDs to pass to AddItemsDialog
  const existingItemIds = useMemo(() => {
    return items.map((item) => {
      if (list?.type === "students") return item.studentId!;
      if (list?.type === "behavior_logs") return item.behaviorLogId!;
      if (list?.type === "academic_logs") return item.academicLogId!;
      return "";
    }).filter(Boolean);
  }, [items, list?.type]);

  if (listLoading || itemsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading list...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground">List not found</p>
            <Button onClick={() => setLocation("/lists")} className="mt-4">
              Back to Lists
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col space-y-8 p-8">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/lists")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              {getListTypeIcon(list.type)}
              <h2 className="text-2xl font-bold tracking-tight">{list.name}</h2>
              <Badge variant="secondary">{getListTypeLabel(list.type)}</Badge>
            </div>
            {list.description && (
              <p className="text-muted-foreground mt-1">{list.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Created by {list.createdBy} on {format(new Date(list.createdAt), "MMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <Button variant="outline" onClick={() => setIsShareDialogOpen(true)}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          )}
          <Button onClick={() => setIsAddItemsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Items
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={items} />

      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this item from the list? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteItemId && handleDeleteItem(deleteItemId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {list && (
        <>
          <AddItemsToListDialog
            open={isAddItemsDialogOpen}
            onOpenChange={setIsAddItemsDialogOpen}
            listType={list.type}
            existingItemIds={existingItemIds}
            onSubmit={handleAddItems}
            isPending={addItems.isPending}
          />

          {isOwner && (
            <ShareListDialog
              open={isShareDialogOpen}
              onOpenChange={setIsShareDialogOpen}
              listId={list.id}
              listName={list.name}
              existingShares={shares}
              onShare={handleShare}
              onUnshare={handleUnshare}
              isPending={shareList.isPending || unshareList.isPending}
            />
          )}
        </>
      )}
    </div>
  );
}
