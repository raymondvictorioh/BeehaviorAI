import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { List, Plus, Users, ClipboardList, BookOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { CreateListDialog } from "@/components/CreateListDialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { BeeLoader } from "@/components/shared/BeeLoader";
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
  createdByUser?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
};

type ListWithItemCount = List & {
  itemCount?: number;
};

export default function Lists() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const orgId = user?.organizations?.[0]?.id;
  const userId = user?.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteListId, setDeleteListId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "mine" | "shared">("all");

  // Fetch lists
  const { data: lists = [], isLoading } = useQuery<ListWithItemCount[]>({
    queryKey: ["/api/organizations", orgId, "lists"],
    enabled: !!orgId && !!userId,
  });

  // Create list mutation
  const createList = useMutation({
    mutationFn: async (data: { name: string; description?: string; type: ListType }) => {
      const res = await apiRequest("POST", `/api/organizations/${orgId}/lists`, data);
      return await res.json();
    },
    onMutate: async (newList) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "lists"] });
      const previousLists = queryClient.getQueryData(["/api/organizations", orgId, "lists"]);

      const tempId = `temp-${Date.now()}`;
      const optimisticList: ListWithItemCount = {
        id: tempId,
        organizationId: orgId!,
        name: newList.name,
        description: newList.description || null,
        type: newList.type,
        createdBy: userId!,
        createdAt: new Date(),
        updatedAt: new Date(),
        itemCount: 0,
        createdByUser: user ? {
          id: user.id,
          firstName: user.firstName || null,
          lastName: user.lastName || null,
          email: user.email || null,
        } : undefined,
      };

      queryClient.setQueryData(["/api/organizations", orgId, "lists"], (old: any[]) =>
        old ? [optimisticList, ...old] : [optimisticList]
      );

      setIsCreateDialogOpen(false);

      return { previousLists, tempId };
    },
    onSuccess: (serverList, _vars, context) => {
      queryClient.setQueryData(["/api/organizations", orgId, "lists"], (old: any[]) =>
        old.map((list: any) => (list.id === context.tempId ? serverList : list))
      );
      toast({
        title: "List created",
        description: "Your new list has been created successfully.",
      });
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(["/api/organizations", orgId, "lists"], context?.previousLists);
      setIsCreateDialogOpen(true);
      toast({
        title: "Failed to create list",
        description: "Could not create the list. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "lists"] });
    },
  });

  // Delete list mutation
  const deleteList = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/organizations/${orgId}/lists/${id}`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "lists"] });
      const previousLists = queryClient.getQueryData(["/api/organizations", orgId, "lists"]);

      queryClient.setQueryData(["/api/organizations", orgId, "lists"], (old: any[]) =>
        old.filter((list) => list.id !== id)
      );

      setDeleteListId(null);

      return { previousLists };
    },
    onSuccess: () => {
      toast({
        title: "List deleted",
        description: "The list has been removed.",
      });
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(["/api/organizations", orgId, "lists"], context?.previousLists);
      toast({
        title: "Failed to delete",
        description: "Could not delete the list. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "lists"] });
    },
  });

  // Filter lists based on search and active tab
  const filteredLists = lists.filter((list) => {
    const matchesSearch = list.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === "mine") {
      return list.createdBy === userId;
    } else if (activeTab === "shared") {
      return list.createdBy !== userId;
    }
    return true;
  });

  // Get counts for tabs
  const myListsCount = lists.filter((l) => l.createdBy === userId).length;
  const sharedListsCount = lists.filter((l) => l.createdBy !== userId).length;

  const getListTypeIcon = (type: ListType) => {
    switch (type) {
      case "students":
        return <Users className="h-4 w-4" />;
      case "behavior_logs":
        return <ClipboardList className="h-4 w-4" />;
      case "academic_logs":
        return <BookOpen className="h-4 w-4" />;
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

  const getCreatedByName = (list: ListWithItemCount) => {
    if (!list.createdByUser) return "Unknown";

    const { firstName, lastName, email } = list.createdByUser;

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) return firstName;
    if (lastName) return lastName;
    if (email) return email;
    return "Unknown";
  };

  // Define table columns
  const columns = useMemo<ColumnDef<ListWithItemCount>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {getListTypeIcon(row.original.type)}
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="secondary">
            {getListTypeLabel(row.original.type)}
          </Badge>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => {
          const desc = row.original.description;
          if (!desc) return <span className="text-muted-foreground">—</span>;
          return desc.length > 60 ? `${desc.substring(0, 60)}...` : desc;
        },
      },
      {
        accessorKey: "itemCount",
        header: "Items",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.itemCount || 0}</span>
        ),
      },
      {
        accessorKey: "createdBy",
        header: "Created By",
        cell: ({ row }) => {
          const isOwner = row.original.createdBy === userId;
          const creatorName = getCreatedByName(row.original);
          return isOwner ? "You" : creatorName;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => format(new Date(row.original.createdAt), "MMM d, yyyy"),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const isOwner = row.original.createdBy === userId;
          if (!isOwner) return null;

          return (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteListId(row.original.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          );
        },
      },
    ],
    [userId]
  );

  const handleCreateList = (data: { name: string; description?: string; type: ListType }) => {
    createList.mutate(data);
  };

  const handleDeleteList = (id: string) => {
    deleteList.mutate(id);
  };

  const handleRowClick = (row: ListWithItemCount) => {
    setLocation(`/lists/${row.id}`);
  };

  // Skeleton loader component
  const ListsSkeleton = () => (
    <div className="flex h-full flex-1 flex-col space-y-8 p-8">
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>

      <div className="space-y-4">
        {/* Search Input Skeleton */}
        <div className="h-10 w-full max-w-sm bg-muted animate-pulse rounded" />

        {/* Tabs Skeleton */}
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          <div className="h-10 w-40 bg-muted animate-pulse rounded" />
        </div>

        {/* DataTable Skeleton */}
        <div className="rounded-md border bg-card mt-6">
          <div className="h-12 bg-muted/50 animate-pulse rounded-t-md border-b" />
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-16 border-b last:border-0 bg-muted/30 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <BeeLoader isLoading={isLoading} skeleton={<ListsSkeleton />}>
      <div className="flex h-full flex-1 flex-col space-y-8 p-8">
      <PageHeader
        title="Lists"
        description="Organize students, behavior logs, and academic logs into custom collections"
        action={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create List
          </Button>
        }
      />

      <div className="space-y-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search lists..."
          testId="input-search-lists"
          className="max-w-sm"
        />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="all">
              All Lists ({lists.length})
            </TabsTrigger>
            <TabsTrigger value="mine">
              My Lists ({myListsCount})
            </TabsTrigger>
            <TabsTrigger value="shared">
              Shared with Me ({sharedListsCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredLists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 border rounded-lg bg-card">
                <List className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No lists found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchQuery
                    ? "Try adjusting your search query"
                    : activeTab === "mine"
                    ? "Create your first list to get started"
                    : "No lists have been shared with you yet"}
                </p>
                {!searchQuery && activeTab === "mine" && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create List
                  </Button>
                )}
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filteredLists}
                onRowClick={handleRowClick}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreateListDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateList}
        isPending={createList.isPending}
      />

      <AlertDialog open={!!deleteListId} onOpenChange={() => setDeleteListId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete List</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this list? This action cannot be undone.
              All items in this list will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteListId && handleDeleteList(deleteListId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </BeeLoader>
  );
}
