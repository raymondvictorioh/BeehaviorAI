import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { Search, Check } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type ListType = "students" | "behavior_logs" | "academic_logs";

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

interface AddItemsToListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listType: ListType;
  existingItemIds: string[]; // IDs already in the list
  onSubmit: (selectedIds: string[]) => void;
  isPending?: boolean;
}

export function AddItemsToListDialog({
  open,
  onOpenChange,
  listType,
  existingItemIds,
  onSubmit,
  isPending = false,
}: AddItemsToListDialogProps) {
  const { user } = useAuth();
  const orgId = user?.organizations?.[0]?.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch students
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/organizations", orgId, "students"],
    enabled: !!orgId && listType === "students",
  });

  // Fetch behavior logs
  const { data: behaviorLogs = [] } = useQuery<BehaviorLog[]>({
    queryKey: ["/api/organizations", orgId, "behavior-logs"],
    enabled: !!orgId && listType === "behavior_logs",
  });

  // Fetch academic logs
  const { data: academicLogs = [] } = useQuery<AcademicLog[]>({
    queryKey: ["/api/organizations", orgId, "academic-logs"],
    enabled: !!orgId && listType === "academic_logs",
  });

  // Get the appropriate data based on list type
  const availableItems = useMemo(() => {
    if (listType === "students") {
      return students
        .filter((student) => !existingItemIds.includes(student.id))
        .filter((student) =>
          student.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    } else if (listType === "behavior_logs") {
      return behaviorLogs
        .filter((log) => !existingItemIds.includes(log.id))
        .filter((log) => {
          const searchLower = searchQuery.toLowerCase();
          return (
            log.student?.name.toLowerCase().includes(searchLower) ||
            log.category?.name.toLowerCase().includes(searchLower) ||
            log.notes.toLowerCase().includes(searchLower)
          );
        });
    } else {
      return academicLogs
        .filter((log) => !existingItemIds.includes(log.id))
        .filter((log) => {
          const searchLower = searchQuery.toLowerCase();
          return (
            log.student?.name.toLowerCase().includes(searchLower) ||
            log.subject?.name.toLowerCase().includes(searchLower) ||
            log.category?.name.toLowerCase().includes(searchLower)
          );
        });
    }
  }, [listType, students, behaviorLogs, academicLogs, existingItemIds, searchQuery]);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (selectedIds.length === availableItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(availableItems.map((item: any) => item.id));
    }
  };

  const handleSubmit = () => {
    onSubmit(selectedIds);
    setSelectedIds([]);
    setSearchQuery("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedIds([]);
      setSearchQuery("");
    }
    onOpenChange(newOpen);
  };

  const renderStudentItem = (student: Student) => (
    <div
      key={student.id}
      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
      onClick={() => handleToggle(student.id)}
    >
      <Checkbox
        checked={selectedIds.includes(student.id)}
        onCheckedChange={() => handleToggle(student.id)}
      />
      <div className="flex-1">
        <p className="font-medium">{student.name}</p>
        {student.email && (
          <p className="text-sm text-muted-foreground">{student.email}</p>
        )}
      </div>
    </div>
  );

  const renderBehaviorLogItem = (log: BehaviorLog) => (
    <div
      key={log.id}
      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
      onClick={() => handleToggle(log.id)}
    >
      <Checkbox
        checked={selectedIds.includes(log.id)}
        onCheckedChange={() => handleToggle(log.id)}
      />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium">{log.student?.name || "Unknown"}</p>
          {log.category && (
            <Badge
              variant="secondary"
              className={log.category.color ? `bg-${log.category.color}-100` : ""}
            >
              {log.category.name}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {format(new Date(log.incidentDate), "MMM d, yyyy")} -{" "}
          {log.notes.length > 60 ? `${log.notes.substring(0, 60)}...` : log.notes}
        </p>
      </div>
    </div>
  );

  const renderAcademicLogItem = (log: AcademicLog) => (
    <div
      key={log.id}
      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
      onClick={() => handleToggle(log.id)}
    >
      <Checkbox
        checked={selectedIds.includes(log.id)}
        onCheckedChange={() => handleToggle(log.id)}
      />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium">{log.student?.name || "Unknown"}</p>
          <Badge variant="outline">{log.subject?.name || "Unknown"}</Badge>
          {log.category && (
            <Badge
              variant="secondary"
              className={log.category.color ? `bg-${log.category.color}-100` : ""}
            >
              {log.category.name}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {format(new Date(log.assessmentDate), "MMM d, yyyy")}
          {log.grade && ` - Grade: ${log.grade}`}
          {log.score && ` - Score: ${log.score}`}
        </p>
      </div>
    </div>
  );

  const getDialogTitle = () => {
    switch (listType) {
      case "students":
        return "Add Students to List";
      case "behavior_logs":
        return "Add Behavior Logs to List";
      case "academic_logs":
        return "Add Academic Logs to List";
    }
  };

  const getDialogDescription = () => {
    switch (listType) {
      case "students":
        return "Select students to add to this list. Students already in the list are not shown.";
      case "behavior_logs":
        return "Select behavior logs to add to this list. Logs already in the list are not shown.";
      case "academic_logs":
        return "Select academic logs to add to this list. Logs already in the list are not shown.";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {availableItems.length > 0 && (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleAll}
              >
                {selectedIds.length === availableItems.length ? "Deselect All" : "Select All"}
              </Button>
              <p className="text-sm text-muted-foreground">
                {selectedIds.length} of {availableItems.length} selected
              </p>
            </div>
          )}

          <ScrollArea className="h-[400px] pr-4">
            {availableItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "No items found matching your search"
                    : "All available items are already in this list"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {listType === "students" &&
                  (availableItems as Student[]).map(renderStudentItem)}
                {listType === "behavior_logs" &&
                  (availableItems as BehaviorLog[]).map(renderBehaviorLogItem)}
                {listType === "academic_logs" &&
                  (availableItems as AcademicLog[]).map(renderAcademicLogItem)}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedIds.length === 0 || isPending}
          >
            {isPending ? "Adding..." : `Add ${selectedIds.length} Item${selectedIds.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
