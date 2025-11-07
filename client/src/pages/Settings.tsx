import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Bell, FileText, Plus, Trash2, Edit } from "lucide-react";
import { CategoryDialog } from "@/components/CategoryDialog";
import type { BehaviorLogCategory } from "@shared/schema";
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

const getColorClass = (color: string | null | undefined): string => {
  const colorMap: Record<string, string> = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
    pink: "bg-pink-500",
    orange: "bg-orange-500",
    teal: "bg-teal-500",
    indigo: "bg-indigo-500",
  };
  return color ? colorMap[color] || "bg-gray-500" : "bg-gray-500";
};

export default function Settings() {
  const { user } = useAuth();
  const orgId = user?.organizations?.[0]?.id;
  const organization = user?.organizations?.[0];
  const { toast } = useToast();
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<BehaviorLogCategory | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  // Organization form state
  const [orgFormData, setOrgFormData] = useState({
    name: organization?.name || "",
    code: organization?.code || "",
    email: organization?.email || "",
    phone: organization?.phone || "",
    address: organization?.address || "",
  });

  // Update form data when organization data loads
  useEffect(() => {
    if (organization) {
      setOrgFormData({
        name: organization.name || "",
        code: organization.code || "",
        email: organization.email || "",
        phone: organization.phone || "",
        address: organization.address || "",
      });
    }
  }, [organization]);

  // Fetch categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<BehaviorLogCategory[]>({
    queryKey: ["/api/organizations", orgId, "behavior-log-categories"],
    enabled: !!orgId,
  });

  // Update organization mutation
  const updateOrganization = useMutation({
    mutationFn: async (data: typeof orgFormData) => {
      if (!orgId) {
        throw new Error("Organization ID is required");
      }

      const response = await fetch(`/api/organizations/${orgId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to update organization: ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Organization updated",
        description: "Your organization details have been successfully updated.",
      });
    },
    onError: (error: Error) => {
      console.error("Organization update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update organization. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOrganizationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrganization.mutate(orgFormData);
  };

  // Create category mutation with optimistic updates
  const createCategory = useMutation({
    mutationFn: async (data: { name: string; description: string | null; color: string | null; displayOrder: number }) => {
      const res = await apiRequest("POST", `/api/organizations/${orgId}/behavior-log-categories`, data);
      return await res.json();
    },
    onMutate: async (newCategory) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "behavior-log-categories"] });
      const previousCategories = queryClient.getQueryData<BehaviorLogCategory[]>([
        "/api/organizations",
        orgId,
        "behavior-log-categories",
      ]);
      const tempId = `temp-${Date.now()}`;
      const optimisticCategory: BehaviorLogCategory = {
        id: tempId,
        organizationId: orgId!,
        name: newCategory.name,
        description: newCategory.description,
        color: newCategory.color,
        displayOrder: newCategory.displayOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      if (previousCategories) {
        queryClient.setQueryData<BehaviorLogCategory[]>(
          ["/api/organizations", orgId, "behavior-log-categories"],
          [...previousCategories, optimisticCategory]
        );
      }
      setIsCategoryDialogOpen(false);
      return { previousCategories, tempId };
    },
    onSuccess: (data: BehaviorLogCategory, _variables, context) => {
      const previousCategories = queryClient.getQueryData<BehaviorLogCategory[]>([
        "/api/organizations",
        orgId,
        "behavior-log-categories",
      ]);
      if (previousCategories && context?.tempId) {
        queryClient.setQueryData<BehaviorLogCategory[]>(
          ["/api/organizations", orgId, "behavior-log-categories"],
          previousCategories.map((cat) => (cat.id === context.tempId ? data : cat))
        );
      }
      toast({
        title: "Category created",
        description: "The category has been successfully created.",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData<BehaviorLogCategory[]>(
          ["/api/organizations", orgId, "behavior-log-categories"],
          context.previousCategories
        );
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create category. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "behavior-log-categories"] });
    },
  });

  // Update category mutation with optimistic updates
  const updateCategory = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BehaviorLogCategory> }) => {
      const res = await apiRequest("PATCH", `/api/organizations/${orgId}/behavior-log-categories/${id}`, updates);
      return await res.json();
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "behavior-log-categories"] });
      const previousCategories = queryClient.getQueryData<BehaviorLogCategory[]>([
        "/api/organizations",
        orgId,
        "behavior-log-categories",
      ]);
      if (previousCategories) {
        queryClient.setQueryData<BehaviorLogCategory[]>(
          ["/api/organizations", orgId, "behavior-log-categories"],
          previousCategories.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat))
        );
      }
      setIsCategoryDialogOpen(false);
      return { previousCategories };
    },
    onSuccess: () => {
      toast({
        title: "Category updated",
        description: "The category has been successfully updated.",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData<BehaviorLogCategory[]>(
          ["/api/organizations", orgId, "behavior-log-categories"],
          context.previousCategories
        );
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update category. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "behavior-log-categories"] });
    },
  });

  // Delete category mutation with optimistic updates
  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/organizations/${orgId}/behavior-log-categories/${id}`);
      return id;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "behavior-log-categories"] });
      const previousCategories = queryClient.getQueryData<BehaviorLogCategory[]>([
        "/api/organizations",
        orgId,
        "behavior-log-categories",
      ]);
      if (previousCategories) {
        queryClient.setQueryData<BehaviorLogCategory[]>(
          ["/api/organizations", orgId, "behavior-log-categories"],
          previousCategories.filter((cat) => cat.id !== id)
        );
      }
      setDeleteCategoryId(null);
      return { previousCategories };
    },
    onSuccess: () => {
      toast({
        title: "Category deleted",
        description: "The category has been successfully deleted.",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData<BehaviorLogCategory[]>(
          ["/api/organizations", orgId, "behavior-log-categories"],
          context.previousCategories
        );
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete category. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "behavior-log-categories"] });
    },
  });

  const handleCategorySubmit = async (data: { name: string; description: string | null; color: string | null; displayOrder: number }) => {
    if (editCategory) {
      updateCategory.mutate({ id: editCategory.id, updates: data });
    } else {
      createCategory.mutate(data);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2" data-testid="text-page-title">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Configure your school's preferences and settings
        </p>
      </div>

      <Tabs defaultValue="organization" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="organization" data-testid="tab-organization">
            <Building2 className="h-4 w-4 mr-2" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="logs" data-testid="tab-logs">
            <FileText className="h-4 w-4 mr-2" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="mt-6 space-y-6">
          <Card data-testid="card-organization-details">
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Update your school's basic information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleOrganizationSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="school-name">School Name</Label>
                    <Input
                      id="school-name"
                      value={orgFormData.name}
                      onChange={(e) => setOrgFormData({ ...orgFormData, name: e.target.value })}
                      data-testid="input-school-name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school-code">School Code</Label>
                    <Input
                      id="school-code"
                      value={orgFormData.code}
                      onChange={(e) => setOrgFormData({ ...orgFormData, code: e.target.value })}
                      data-testid="input-school-code"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="school-email">School Email</Label>
                    <Input
                      id="school-email"
                      type="email"
                      value={orgFormData.email}
                      onChange={(e) => setOrgFormData({ ...orgFormData, email: e.target.value })}
                      data-testid="input-school-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school-phone">School Phone</Label>
                    <Input
                      id="school-phone"
                      type="tel"
                      value={orgFormData.phone}
                      onChange={(e) => setOrgFormData({ ...orgFormData, phone: e.target.value })}
                      data-testid="input-school-phone"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school-address">Address</Label>
                  <Input
                    id="school-address"
                    value={orgFormData.address}
                    onChange={(e) => setOrgFormData({ ...orgFormData, address: e.target.value })}
                    data-testid="input-school-address"
                  />
                </div>

                <Button
                  type="submit"
                  data-testid="button-save-organization"
                  disabled={updateOrganization.isPending}
                >
                  {updateOrganization.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6 space-y-6">
          <Card data-testid="card-user-management">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage admin users and teachers who can access the system
                  </CardDescription>
                </div>
                <Button data-testid="button-add-user">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">John Smith</p>
                    <p className="text-sm text-muted-foreground">john.smith@lincolnhigh.edu</p>
                    <Badge variant="secondary" className="mt-1">Administrator</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" data-testid="button-edit-user-1">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" data-testid="button-delete-user-1">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sarah Johnson</p>
                    <p className="text-sm text-muted-foreground">sarah.johnson@lincolnhigh.edu</p>
                    <Badge variant="secondary" className="mt-1">Teacher</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" data-testid="button-edit-user-2">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" data-testid="button-delete-user-2">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card data-testid="card-notification-settings">
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure email notifications for behavior logs and follow-ups
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-new-log">New Behavior Log</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications when a new behavior log is created
                  </p>
                </div>
                <Switch id="notify-new-log" defaultChecked data-testid="switch-notify-new-log" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-serious">Serious Incidents</Label>
                  <p className="text-sm text-muted-foreground">
                    Get immediate alerts for serious behavior incidents
                  </p>
                </div>
                <Switch id="notify-serious" defaultChecked data-testid="switch-notify-serious" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-followup">Follow-up Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive reminders for upcoming follow-up tasks
                  </p>
                </div>
                <Switch id="notify-followup" defaultChecked data-testid="switch-notify-followup" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-meeting">Meeting Notes</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new meeting notes are added
                  </p>
                </div>
                <Switch id="notify-meeting" data-testid="switch-notify-meeting" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-weekly">Weekly Summary</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a weekly summary of behavior activities
                  </p>
                </div>
                <Switch id="notify-weekly" defaultChecked data-testid="switch-notify-weekly" />
              </div>

              <Button data-testid="button-save-notifications">Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-6 space-y-6">
          <Card data-testid="card-log-categories">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Behavior Log Categories</CardTitle>
                  <CardDescription>
                    Manage the categories used for classifying behavior logs
                  </CardDescription>
                </div>
                <Button 
                  data-testid="button-add-category"
                  onClick={() => {
                    setEditCategory(null);
                    setIsCategoryDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingCategories ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading categories...</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No categories yet. Add your first category to get started.</p>
                  <Button
                    onClick={() => {
                      setEditCategory(null);
                      setIsCategoryDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {categories.map((category, index) => (
                    <div
                      key={category.id}
                      className="border rounded-lg p-4 flex items-center gap-4"
                      data-testid={`category-item-${index}`}
                    >
                      <div className={`h-8 w-8 rounded-md ${getColorClass(category.color)} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-muted-foreground">{category.description || "No description"}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-edit-category-${index}`}
                          onClick={() => {
                            setEditCategory(category);
                            setIsCategoryDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-category-${index}`}
                          onClick={() => setDeleteCategoryId(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        onSubmit={handleCategorySubmit}
        category={editCategory}
        isPending={editCategory ? updateCategory.isPending : createCategory.isPending}
      />

      <AlertDialog open={!!deleteCategoryId} onOpenChange={(open) => !open && setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot be undone. 
              Behavior logs using this category will still reference it, but you won't be able to edit it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCategoryId && deleteCategory.mutate(deleteCategoryId)}
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
