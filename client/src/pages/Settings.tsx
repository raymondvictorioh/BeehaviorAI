import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Bell, FileText, Plus, Trash2, Edit, GraduationCap, BookOpen, Award } from "lucide-react";
import { CategoryDialog } from "@/components/CategoryDialog";
import { ClassDialog } from "@/components/ClassDialog";
import { SubjectDialog } from "@/components/SubjectDialog";
import { AcademicCategoryDialog } from "@/components/AcademicCategoryDialog";
import type { BehaviorLogCategory, User, Class, Subject, AcademicLogCategory } from "@shared/schema";
import { getColorClass } from "@/lib/utils/colorUtils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/shared/PageHeader";
import { BeeLoader } from "@/components/shared/BeeLoader";
import { cn } from "@/lib/utils";
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

interface OrganizationUser {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  joinedAt: Date | string | null;
  user: User;
}

type SettingsSection =
  | "organization"
  | "users"
  | "classes"
  | "subjects"
  | "notifications"
  | "logs"
  | "academic";

export default function Settings() {
  const { user } = useAuth();
  const orgId = user?.organizations?.[0]?.id;
  const organization = user?.organizations?.[0];
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<SettingsSection>("organization");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<BehaviorLogCategory | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [editClass, setEditClass] = useState<Class | null>(null);
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null);
  const [isAcademicCategoryDialogOpen, setIsAcademicCategoryDialogOpen] = useState(false);
  const [editAcademicCategory, setEditAcademicCategory] = useState<AcademicLogCategory | null>(null);
  const [deleteAcademicCategoryId, setDeleteAcademicCategoryId] = useState<string | null>(null);

  // Fetch organization users
  const { data: organizationUsers = [], isLoading: isLoadingUsers } = useQuery<OrganizationUser[]>({
    queryKey: ["/api/organizations", orgId, "users"],
    enabled: !!orgId,
  });

  // Fetch classes
  const { data: classes = [], isLoading: isLoadingClasses } = useQuery<Class[]>({
    queryKey: ["/api/organizations", orgId, "classes"],
    enabled: !!orgId,
  });

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

  // Fetch subjects
  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery<Subject[]>({
    queryKey: ["/api/organizations", orgId, "subjects"],
    enabled: !!orgId,
  });

  // Fetch academic categories
  const { data: academicCategories = [], isLoading: isLoadingAcademicCategories } = useQuery<AcademicLogCategory[]>({
    queryKey: ["/api/organizations", orgId, "academic-log-categories"],
    enabled: !!orgId,
  });

  // Fetch categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<BehaviorLogCategory[]>({
    queryKey: ["/api/organizations", orgId, "behavior-log-categories"],
    enabled: !!orgId,
  });

  // Combine all loading states
  const isLoading = isLoadingUsers || isLoadingClasses || isLoadingCategories || isLoadingSubjects || isLoadingAcademicCategories;

  // Update organization mutation
  const updateOrganization = useMutation({
    mutationFn: async (data: typeof orgFormData) => {
      if (!orgId) {
        throw new Error("Organization ID is required");
      }

      const res = await apiRequest("PATCH", `/api/organizations/${orgId}`, data);
      return await res.json();
    },
    onMutate: async (updatedData) => {
      // Cancel outgoing queries to prevent race conditions
      await queryClient.cancelQueries({
        queryKey: ["/api/auth/user"]
      });

      // Snapshot current user data for rollback
      const previousUser = queryClient.getQueryData(["/api/auth/user"]);

      // Optimistically update user cache with new organization data
      if (previousUser && user?.organizations?.[0]) {
        const updatedUser = {
          ...previousUser,
          organizations: [
            {
              ...user.organizations[0],
              ...updatedData,
            },
            ...user.organizations.slice(1),
          ],
        };

        queryClient.setQueryData(["/api/auth/user"], updatedUser);
      }

      // Return context for rollback
      return { previousUser };
    },
    onSuccess: (serverData) => {
      // Update cache with real server data
      const currentUser = queryClient.getQueryData(["/api/auth/user"]);

      if (currentUser && user?.organizations?.[0]) {
        const updatedUser = {
          ...currentUser,
          organizations: [
            serverData,
            ...user.organizations.slice(1),
          ],
        };

        queryClient.setQueryData(["/api/auth/user"], updatedUser);
      }

      toast({
        title: "Organization updated",
        description: "Your organization details have been successfully updated.",
      });
    },
    onError: (error: Error, _variables, context) => {
      // Rollback to previous state on error
      if (context?.previousUser) {
        queryClient.setQueryData(["/api/auth/user"], context.previousUser);
      }

      console.error("Organization update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update organization. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ["/api/auth/user"]
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

  // Create class mutation with optimistic updates
  const createClass = useMutation({
    mutationFn: async (data: { name: string; description: string | null; isArchived: boolean }) => {
      const res = await apiRequest("POST", `/api/organizations/${orgId}/classes`, data);
      return await res.json();
    },
    onMutate: async (newClass) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "classes"] });
      const previousClasses = queryClient.getQueryData<Class[]>([
        "/api/organizations",
        orgId,
        "classes",
      ]);
      const tempId = `temp-${Date.now()}`;
      const optimisticClass: Class = {
        id: tempId,
        organizationId: orgId!,
        name: newClass.name,
        description: newClass.description,
        isArchived: newClass.isArchived,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      if (previousClasses) {
        queryClient.setQueryData<Class[]>(
          ["/api/organizations", orgId, "classes"],
          [...previousClasses, optimisticClass]
        );
      }
      setIsClassDialogOpen(false);
      return { previousClasses, tempId };
    },
    onSuccess: (data: Class, _variables, context) => {
      const previousClasses = queryClient.getQueryData<Class[]>([
        "/api/organizations",
        orgId,
        "classes",
      ]);
      if (previousClasses && context?.tempId) {
        queryClient.setQueryData<Class[]>(
          ["/api/organizations", orgId, "classes"],
          previousClasses.map((c) => (c.id === context.tempId ? data : c))
        );
      }
      toast({
        title: "Class created",
        description: "The class has been successfully created.",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousClasses) {
        queryClient.setQueryData<Class[]>(
          ["/api/organizations", orgId, "classes"],
          context.previousClasses
        );
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create class. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "classes"] });
    },
  });

  // Update class mutation with optimistic updates
  const updateClass = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Class> }) => {
      const res = await apiRequest("PATCH", `/api/organizations/${orgId}/classes/${id}`, updates);
      return await res.json();
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "classes"] });
      const previousClasses = queryClient.getQueryData<Class[]>([
        "/api/organizations",
        orgId,
        "classes",
      ]);
      if (previousClasses) {
        queryClient.setQueryData<Class[]>(
          ["/api/organizations", orgId, "classes"],
          previousClasses.map((c) => (c.id === id ? { ...c, ...updates } : c))
        );
      }
      setIsClassDialogOpen(false);
      return { previousClasses };
    },
    onSuccess: () => {
      toast({
        title: "Class updated",
        description: "The class has been successfully updated.",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousClasses) {
        queryClient.setQueryData<Class[]>(
          ["/api/organizations", orgId, "classes"],
          context.previousClasses
        );
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update class. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "classes"] });
    },
  });

  // Delete class mutation with optimistic updates
  const deleteClass = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/organizations/${orgId}/classes/${id}`);
      return id;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "classes"] });
      const previousClasses = queryClient.getQueryData<Class[]>([
        "/api/organizations",
        orgId,
        "classes",
      ]);
      if (previousClasses) {
        queryClient.setQueryData<Class[]>(
          ["/api/organizations", orgId, "classes"],
          previousClasses.filter((c) => c.id !== id)
        );
      }
      setDeleteClassId(null);
      return { previousClasses };
    },
    onSuccess: () => {
      toast({
        title: "Class deleted",
        description: "The class has been successfully deleted.",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousClasses) {
        queryClient.setQueryData<Class[]>(
          ["/api/organizations", orgId, "classes"],
          context.previousClasses
        );
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete class. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "classes"] });
    },
  });

  const handleClassSubmit = async (data: { name: string; description: string | null; isArchived: boolean }) => {
    if (editClass) {
      updateClass.mutate({ id: editClass.id, updates: data });
    } else {
      createClass.mutate(data);
    }
  };

  // Subject mutations with optimistic updates
  const createSubject = useMutation({
    mutationFn: async (data: { name: string; code: string | null; description: string | null; isArchived: boolean; isDefault?: boolean }) => {
      const res = await apiRequest("POST", `/api/organizations/${orgId}/subjects`, { ...data, isDefault: false });
      return await res.json();
    },
    onMutate: async (newSubject) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "subjects"] });
      const previousSubjects = queryClient.getQueryData<Subject[]>(["/api/organizations", orgId, "subjects"]);
      const tempId = `temp-${Date.now()}`;
      const optimisticSubject: Subject = {
        id: tempId,
        organizationId: orgId!,
        name: newSubject.name,
        code: newSubject.code,
        description: newSubject.description,
        isDefault: false,
        isArchived: newSubject.isArchived,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      if (previousSubjects) {
        queryClient.setQueryData<Subject[]>(
          ["/api/organizations", orgId, "subjects"],
          [...previousSubjects, optimisticSubject]
        );
      }
      setIsSubjectDialogOpen(false);
      return { previousSubjects, tempId };
    },
    onSuccess: (data: Subject, _variables, context) => {
      const previousSubjects = queryClient.getQueryData<Subject[]>(["/api/organizations", orgId, "subjects"]);
      if (previousSubjects && context?.tempId) {
        queryClient.setQueryData<Subject[]>(
          ["/api/organizations", orgId, "subjects"],
          previousSubjects.map((s) => (s.id === context.tempId ? data : s))
        );
      }
      toast({
        title: "Subject created",
        description: "The subject has been successfully created.",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousSubjects) {
        queryClient.setQueryData<Subject[]>(["/api/organizations", orgId, "subjects"], context.previousSubjects);
      }
      setIsSubjectDialogOpen(true);
      toast({
        title: "Error",
        description: error.message || "Failed to create subject. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "subjects"] });
    },
  });

  const updateSubject = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Subject> }) => {
      const res = await apiRequest("PATCH", `/api/organizations/${orgId}/subjects/${id}`, updates);
      return await res.json();
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "subjects"] });
      const previousSubjects = queryClient.getQueryData<Subject[]>(["/api/organizations", orgId, "subjects"]);
      if (previousSubjects) {
        queryClient.setQueryData<Subject[]>(
          ["/api/organizations", orgId, "subjects"],
          previousSubjects.map((s) => (s.id === id ? { ...s, ...updates } : s))
        );
      }
      setIsSubjectDialogOpen(false);
      return { previousSubjects };
    },
    onSuccess: () => {
      toast({
        title: "Subject updated",
        description: "The subject has been successfully updated.",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousSubjects) {
        queryClient.setQueryData<Subject[]>(["/api/organizations", orgId, "subjects"], context.previousSubjects);
      }
      setIsSubjectDialogOpen(true);
      toast({
        title: "Error",
        description: error.message || "Failed to update subject. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "subjects"] });
    },
  });

  const deleteSubject = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/organizations/${orgId}/subjects/${id}`);
      return id;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "subjects"] });
      const previousSubjects = queryClient.getQueryData<Subject[]>(["/api/organizations", orgId, "subjects"]);
      if (previousSubjects) {
        queryClient.setQueryData<Subject[]>(
          ["/api/organizations", orgId, "subjects"],
          previousSubjects.filter((s) => s.id !== id)
        );
      }
      setDeleteSubjectId(null);
      return { previousSubjects };
    },
    onSuccess: () => {
      toast({
        title: "Subject deleted",
        description: "The subject has been successfully deleted.",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousSubjects) {
        queryClient.setQueryData<Subject[]>(["/api/organizations", orgId, "subjects"], context.previousSubjects);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete subject. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "subjects"] });
    },
  });

  const handleSubjectSubmit = async (data: { name: string; code: string | null; description: string | null; isArchived: boolean }) => {
    if (editSubject) {
      updateSubject.mutate({ id: editSubject.id, updates: data });
    } else {
      createSubject.mutate(data);
    }
  };

  // Academic category mutations with optimistic updates
  const createAcademicCategory = useMutation({
    mutationFn: async (data: { name: string; description: string | null; color: string | null; displayOrder: number }) => {
      const res = await apiRequest("POST", `/api/organizations/${orgId}/academic-log-categories`, data);
      return await res.json();
    },
    onMutate: async (newCategory) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "academic-log-categories"] });
      const previousCategories = queryClient.getQueryData<AcademicLogCategory[]>([
        "/api/organizations",
        orgId,
        "academic-log-categories",
      ]);
      const tempId = `temp-${Date.now()}`;
      const optimisticCategory: AcademicLogCategory = {
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
        queryClient.setQueryData<AcademicLogCategory[]>(
          ["/api/organizations", orgId, "academic-log-categories"],
          [...previousCategories, optimisticCategory]
        );
      }
      setIsAcademicCategoryDialogOpen(false);
      return { previousCategories, tempId };
    },
    onSuccess: (data: AcademicLogCategory, _variables, context) => {
      const previousCategories = queryClient.getQueryData<AcademicLogCategory[]>([
        "/api/organizations",
        orgId,
        "academic-log-categories",
      ]);
      if (previousCategories && context?.tempId) {
        queryClient.setQueryData<AcademicLogCategory[]>(
          ["/api/organizations", orgId, "academic-log-categories"],
          previousCategories.map((cat) => (cat.id === context.tempId ? data : cat))
        );
      }
      toast({
        title: "Academic category created",
        description: "The academic category has been successfully created.",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData<AcademicLogCategory[]>(
          ["/api/organizations", orgId, "academic-log-categories"],
          context.previousCategories
        );
      }
      setIsAcademicCategoryDialogOpen(true);
      toast({
        title: "Error",
        description: error.message || "Failed to create academic category. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "academic-log-categories"] });
    },
  });

  const updateAcademicCategory = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AcademicLogCategory> }) => {
      const res = await apiRequest("PATCH", `/api/organizations/${orgId}/academic-log-categories/${id}`, updates);
      return await res.json();
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "academic-log-categories"] });
      const previousCategories = queryClient.getQueryData<AcademicLogCategory[]>([
        "/api/organizations",
        orgId,
        "academic-log-categories",
      ]);
      if (previousCategories) {
        queryClient.setQueryData<AcademicLogCategory[]>(
          ["/api/organizations", orgId, "academic-log-categories"],
          previousCategories.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat))
        );
      }
      setIsAcademicCategoryDialogOpen(false);
      return { previousCategories };
    },
    onSuccess: () => {
      toast({
        title: "Academic category updated",
        description: "The academic category has been successfully updated.",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData<AcademicLogCategory[]>(
          ["/api/organizations", orgId, "academic-log-categories"],
          context.previousCategories
        );
      }
      setIsAcademicCategoryDialogOpen(true);
      toast({
        title: "Error",
        description: error.message || "Failed to update academic category. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "academic-log-categories"] });
    },
  });

  const deleteAcademicCategory = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/organizations/${orgId}/academic-log-categories/${id}`);
      return id;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/organizations", orgId, "academic-log-categories"] });
      const previousCategories = queryClient.getQueryData<AcademicLogCategory[]>([
        "/api/organizations",
        orgId,
        "academic-log-categories",
      ]);
      if (previousCategories) {
        queryClient.setQueryData<AcademicLogCategory[]>(
          ["/api/organizations", orgId, "academic-log-categories"],
          previousCategories.filter((cat) => cat.id !== id)
        );
      }
      setDeleteAcademicCategoryId(null);
      return { previousCategories };
    },
    onSuccess: () => {
      toast({
        title: "Academic category deleted",
        description: "The academic category has been successfully deleted.",
      });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData<AcademicLogCategory[]>(
          ["/api/organizations", orgId, "academic-log-categories"],
          context.previousCategories
        );
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete academic category. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", orgId, "academic-log-categories"] });
    },
  });

  const handleAcademicCategorySubmit = async (data: { name: string; description: string | null; color: string | null; displayOrder: number }) => {
    if (editAcademicCategory) {
      updateAcademicCategory.mutate({ id: editAcademicCategory.id, updates: data });
    } else {
      createAcademicCategory.mutate(data);
    }
  };

  // Navigation items
  const navigationItems = [
    { id: "organization" as const, label: "Organization", icon: Building2 },
    { id: "users" as const, label: "Users", icon: Users },
    { id: "classes" as const, label: "Classes", icon: GraduationCap },
    { id: "subjects" as const, label: "Subjects", icon: BookOpen },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "logs" as const, label: "Behavior", icon: FileText },
    { id: "academic" as const, label: "Academic", icon: Award },
  ];

  // Skeleton loader component
  const SettingsSkeleton = () => (
    <div className="flex h-full">
      {/* Sidebar Skeleton */}
      <div className="w-64 border-r bg-card p-6 space-y-2">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-10 bg-muted animate-pulse rounded" />
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 p-6 space-y-6">
        <div>
          <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        </div>

        <div className="rounded-lg border bg-card p-6 space-y-6">
          <div>
            <div className="h-6 w-48 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-96 bg-muted animate-pulse rounded" />
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-10 bg-muted animate-pulse rounded" />
              <div className="h-10 bg-muted animate-pulse rounded" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-10 bg-muted animate-pulse rounded" />
              <div className="h-10 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-10 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <BeeLoader isLoading={isLoading} skeleton={<SettingsSkeleton />}>
      <div className="flex h-full">
        {/* Vertical Navigation Sidebar */}
        <nav className="w-64 border-r bg-card">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Settings</h2>
              <p className="text-sm text-muted-foreground">
                Configure your school's preferences
              </p>
            </div>
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    data-testid={`nav-${item.id}`}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                      activeSection === item.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {activeSection === "organization" && (
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
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeSection === "users" && (
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
                  {organizationUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">No users found in this organization.</p>
                      <Button data-testid="button-add-first-user">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First User
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {organizationUsers.map((orgUser) => {
                        const user = orgUser.user;
                        const displayName = user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.email || "Unknown User";
                        const initials = user.firstName && user.lastName
                          ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
                          : user.email?.[0]?.toUpperCase() || "U";
                        const roleLabel = orgUser.role === "owner"
                          ? "Owner"
                          : orgUser.role === "admin"
                          ? "Administrator"
                          : "Teacher";
                        const roleVariant = orgUser.role === "owner"
                          ? "default"
                          : orgUser.role === "admin"
                          ? "secondary"
                          : "outline";

                        return (
                          <div
                            key={orgUser.id}
                            className="border rounded-lg p-4 flex items-center justify-between"
                            data-testid={`user-item-${orgUser.userId}`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="text-sm">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{displayName}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                <Badge variant={roleVariant} className="mt-1">
                                  {roleLabel}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`button-edit-user-${orgUser.userId}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                data-testid={`button-delete-user-${orgUser.userId}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === "classes" && (
              <Card data-testid="card-class-management">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Class Management</CardTitle>
                      <CardDescription>
                        Manage classes for your organization. Students can be assigned to classes.
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => {
                        setEditClass(null);
                        setIsClassDialogOpen(true);
                      }}
                      data-testid="button-add-class"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Class
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {classes.length === 0 ? (
                    <div className="text-center py-12">
                      <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">No classes found. Create your first class to get started.</p>
                      <Button
                        onClick={() => {
                          setEditClass(null);
                          setIsClassDialogOpen(true);
                        }}
                        data-testid="button-add-first-class"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Class
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {classes.map((classItem) => (
                        <div
                          key={classItem.id}
                          className={`border rounded-lg p-4 flex items-center justify-between ${
                            classItem.isArchived ? "opacity-60" : ""
                          }`}
                          data-testid={`class-item-${classItem.id}`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{classItem.name}</p>
                              {classItem.isArchived && (
                                <Badge variant="secondary" className="text-xs">Archived</Badge>
                              )}
                            </div>
                            {classItem.description && (
                              <p className="text-sm text-muted-foreground mt-1">{classItem.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditClass(classItem);
                                setIsClassDialogOpen(true);
                              }}
                              data-testid={`button-edit-class-${classItem.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteClassId(classItem.id)}
                              data-testid={`button-delete-class-${classItem.id}`}
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
            )}

            {activeSection === "notifications" && (
              <Card data-testid="card-notification-settings">
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Configure email notifications for behavior logs and tasks
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
                      <Label htmlFor="notify-task">Task Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive reminders for upcoming tasks
                      </p>
                    </div>
                    <Switch id="notify-task" defaultChecked data-testid="switch-notify-task" />
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
            )}

            {activeSection === "logs" && (
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
                  {categories.length === 0 ? (
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
            )}

            {activeSection === "subjects" && (
              <Card data-testid="card-subjects">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Subjects</CardTitle>
                      <CardDescription>
                        Manage the subjects taught at your school
                      </CardDescription>
                    </div>
                    <Button
                      data-testid="button-add-subject"
                      onClick={() => {
                        setEditSubject(null);
                        setIsSubjectDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Subject
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {subjects.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No subjects yet. Add your first subject to get started.</p>
                      <Button
                        onClick={() => {
                          setEditSubject(null);
                          setIsSubjectDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Subject
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {subjects.map((subject, index) => (
                        <div
                          key={subject.id}
                          className="border rounded-lg p-4 flex items-center gap-4"
                          data-testid={`subject-item-${index}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{subject.name}</p>
                              {subject.isDefault && <Badge variant="outline" className="text-xs">Default</Badge>}
                              {subject.isArchived && <Badge variant="secondary" className="text-xs">Archived</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{subject.code || "No code"}</p>
                            <p className="text-sm text-muted-foreground">{subject.description || "No description"}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-edit-subject-${index}`}
                              onClick={() => {
                                setEditSubject(subject);
                                setIsSubjectDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              data-testid={`button-delete-subject-${index}`}
                              onClick={() => setDeleteSubjectId(subject.id)}
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
            )}

            {activeSection === "academic" && (
              <Card data-testid="card-academic-categories">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Academic Log Categories</CardTitle>
                      <CardDescription>
                        Manage the categories used for classifying academic logs
                      </CardDescription>
                    </div>
                    <Button
                      data-testid="button-add-academic-category"
                      onClick={() => {
                        setEditAcademicCategory(null);
                        setIsAcademicCategoryDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {academicCategories.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No categories yet. Add your first category to get started.</p>
                      <Button
                        onClick={() => {
                          setEditAcademicCategory(null);
                          setIsAcademicCategoryDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Category
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {academicCategories.map((category, index) => (
                        <div
                          key={category.id}
                          className="border rounded-lg p-4 flex items-center gap-4"
                          data-testid={`academic-category-item-${index}`}
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
                              data-testid={`button-edit-academic-category-${index}`}
                              onClick={() => {
                                setEditAcademicCategory(category);
                                setIsAcademicCategoryDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              data-testid={`button-delete-academic-category-${index}`}
                              onClick={() => setDeleteAcademicCategoryId(category.id)}
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
            )}
          </div>
        </div>
      </div>

      <CategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        onSubmit={handleCategorySubmit}
        category={editCategory}
        isPending={editCategory ? updateCategory.isPending : createCategory.isPending}
      />
      <ClassDialog
        open={isClassDialogOpen}
        onOpenChange={setIsClassDialogOpen}
        onSubmit={handleClassSubmit}
        classData={editClass}
        isPending={editClass ? updateClass.isPending : createClass.isPending}
      />
      <SubjectDialog
        open={isSubjectDialogOpen}
        onOpenChange={setIsSubjectDialogOpen}
        onSubmit={handleSubjectSubmit}
        subjectData={editSubject}
        isPending={editSubject ? updateSubject.isPending : createSubject.isPending}
      />
      <AcademicCategoryDialog
        open={isAcademicCategoryDialogOpen}
        onOpenChange={setIsAcademicCategoryDialogOpen}
        onSubmit={handleAcademicCategorySubmit}
        category={editAcademicCategory}
        isPending={editAcademicCategory ? updateAcademicCategory.isPending : createAcademicCategory.isPending}
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
      <AlertDialog open={!!deleteClassId} onOpenChange={(open) => !open && setDeleteClassId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this class? This action cannot be undone. If students are assigned to this class, you must unassign them first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteClassId && deleteClass.mutate(deleteClassId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!deleteSubjectId} onOpenChange={(open) => !open && setDeleteSubjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subject</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this subject? This action cannot be undone. Academic logs using this subject will prevent deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSubjectId && deleteSubject.mutate(deleteSubjectId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!deleteAcademicCategoryId} onOpenChange={(open) => !open && setDeleteAcademicCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Academic Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this academic category? This action cannot be undone. Academic logs using this category will prevent deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAcademicCategoryId && deleteAcademicCategory.mutate(deleteAcademicCategoryId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </BeeLoader>
  );
}
