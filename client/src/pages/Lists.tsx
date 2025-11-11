import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { List, Plus, Users, ClipboardList, BookOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateListDialog } from "@/components/CreateListDialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
        createdBy: user?.email || "Unknown",
        createdAt: new Date(),
        updatedAt: new Date(),
        itemCount: 0,
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
      return list.createdBy === user?.email;
    } else if (activeTab === "shared") {
      return list.createdBy !== user?.email;
    }
    return true;
  });

  // Get counts for tabs
  const myListsCount = lists.filter((l) => l.createdBy === user?.email).length;
  const sharedListsCount = lists.filter((l) => l.createdBy !== user?.email).length;

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

  const handleCreateList = (data: { name: string; description?: string; type: ListType }) => {
    createList.mutate(data);
  };

  const handleDeleteList = (id: string) => {
    deleteList.mutate(id);
  };

  const handleCardClick = (listId: string) => {
    setLocation(`/lists/${listId}`);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading lists...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col space-y-8 p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <div className="flex items-center gap-2">
            <List className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Lists</h2>
          </div>
          <p className="text-muted-foreground">
            Organize students, behavior logs, and academic logs into custom collections
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create List
        </Button>
      </div>

      <div className="space-y-4">
        <Input
          placeholder="Search lists..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm bg-card"
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
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
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
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredLists.map((list) => {
                  const isOwner = list.createdBy === user?.email;
                  return (
                    <Card
                      key={list.id}
                      className="cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={() => handleCardClick(list.id)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getListTypeIcon(list.type)}
                            <CardTitle className="text-lg">{list.name}</CardTitle>
                          </div>
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteListId(list.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {list.description && (
                          <CardDescription className="line-clamp-2">
                            {list.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm">
                          <Badge variant="secondary">
                            {getListTypeLabel(list.type)}
                          </Badge>
                          <span className="text-muted-foreground">
                            {list.itemCount || 0} items
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {isOwner ? "Created by you" : `Created by ${list.createdBy}`}
                          </span>
                          <span>{format(new Date(list.createdAt), "MMM d, yyyy")}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
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
  );
}
