import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BehaviorLogEntry } from "@/components/BehaviorLogEntry";
import { BehaviorLogDetailsSheet } from "@/components/BehaviorLogDetailsSheet";
import { AISummaryCard } from "@/components/AISummaryCard";
import { MeetingNoteCard } from "@/components/MeetingNoteCard";
import { FollowUpItem } from "@/components/FollowUpItem";
import { AddBehaviorLogDialog } from "@/components/AddBehaviorLogDialog";
import { ArrowLeft, Plus, Mail, GraduationCap } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { Student, BehaviorLog, MeetingNote, FollowUp } from "@shared/schema";
import { format } from "date-fns";

export default function StudentProfile() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/students/:id");
  const studentId = params?.id;
  const { user } = useAuth();
  const orgId = user?.organizations?.[0]?.id;

  const [isAddLogDialogOpen, setIsAddLogDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isLogDetailsOpen, setIsLogDetailsOpen] = useState(false);

  // Fetch student data
  const { data: student, isLoading: isLoadingStudent } = useQuery<Student>({
    queryKey: ["/api/organizations", orgId, "students", studentId],
    enabled: !!orgId && !!studentId,
  });

  // Fetch behavior logs
  const { data: behaviorLogs = [], isLoading: isLoadingLogs } = useQuery<BehaviorLog[]>({
    queryKey: ["/api/organizations", orgId, "students", studentId, "behavior-logs"],
    enabled: !!orgId && !!studentId,
  });

  // Fetch meeting notes
  const { data: meetingNotes = [], isLoading: isLoadingNotes } = useQuery<MeetingNote[]>({
    queryKey: ["/api/organizations", orgId, "students", studentId, "meeting-notes"],
    enabled: !!orgId && !!studentId,
  });

  // Fetch follow-ups
  const { data: followUps = [], isLoading: isLoadingFollowUps } = useQuery<FollowUp[]>({
    queryKey: ["/api/organizations", orgId, "students", studentId, "follow-ups"],
    enabled: !!orgId && !!studentId,
  });

  const isLoading = isLoadingStudent || isLoadingLogs || isLoadingNotes || isLoadingFollowUps;

  const handleViewLog = (log: any) => {
    setSelectedLog(log);
    setIsLogDetailsOpen(true);
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    // TODO: Implement API call to update notes
    console.log("Update notes:", id, notes);
  };

  const handleUpdateStrategies = (id: string, strategies: string) => {
    // TODO: Implement API call to update strategies
    console.log("Update strategies:", id, strategies);
  };

  const handleDeleteLog = (id: string) => {
    // TODO: Implement API call to delete log
    console.log("Delete log:", id);
  };

  const getInitials = () => {
    if (student?.name) {
      const nameParts = student.name.split(" ");
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
      }
      return student.name.substring(0, 2).toUpperCase();
    }
    return "ST";
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Student Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The student you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => setLocation("/students")} data-testid="button-back-to-students">
            Back to Students
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Button
        variant="ghost"
        onClick={() => setLocation("/students")}
        className="mb-4"
        data-testid="button-back"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Students
      </Button>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6 flex-wrap">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-semibold mb-4" data-testid="text-student-name">
                {student.name}
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {student.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm" data-testid="text-student-email">{student.email}</span>
                  </div>
                )}
                {student.class && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm" data-testid="text-student-class">{student.class}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {behaviorLogs.length > 0 && (
        <AISummaryCard
          summary="AI-generated summary will be available soon. This feature uses behavior logs to provide insights about the student's progress and areas for improvement."
          lastUpdated={format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
          onRegenerate={() => console.log("Regenerating summary")}
        />
      )}

      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="logs" data-testid="tab-logs">Behavior Logs</TabsTrigger>
          <TabsTrigger value="followups" data-testid="tab-followups">Follow-ups</TabsTrigger>
          <TabsTrigger value="meetings" data-testid="tab-meetings">Meeting Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Behavior Logs</h2>
            <Button onClick={() => setIsAddLogDialogOpen(true)} data-testid="button-add-log">
              <Plus className="h-4 w-4 mr-2" />
              Add Log
            </Button>
          </div>
          <div className="space-y-4">
            {behaviorLogs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Behavior Logs Yet</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-4">
                    Start tracking this student's behavior by adding your first log entry.
                  </p>
                  <Button onClick={() => setIsAddLogDialogOpen(true)} data-testid="button-add-first-log">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Log
                  </Button>
                </CardContent>
              </Card>
            ) : (
              behaviorLogs.map((log) => (
                <BehaviorLogEntry
                  key={log.id}
                  id={log.id}
                  date={log.loggedAt ? format(new Date(log.loggedAt), "MMMM d, yyyy") : ""}
                  category={log.category || ""}
                  notes={log.notes || ""}
                  onView={() => handleViewLog(log)}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="followups" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Follow-up Points</h2>
            <Button data-testid="button-add-followup">
              <Plus className="h-4 w-4 mr-2" />
              Add Follow-up
            </Button>
          </div>
          <div className="space-y-4">
            {followUps.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground text-center max-w-md">
                    No follow-up tasks yet. Add follow-ups to track action items for this student.
                  </p>
                </CardContent>
              </Card>
            ) : (
              followUps.map((followUp) => (
                <FollowUpItem
                  key={followUp.id}
                  id={followUp.id}
                  title={followUp.title}
                  dueDate={format(new Date(followUp.dueDate), "MMMM d, yyyy")}
                  priority={followUp.priority as "low" | "medium" | "high"}
                  completed={followUp.completed === "true"}
                  onToggle={() => console.log("Toggle", followUp.id)}
                  onEdit={() => console.log("Edit", followUp.id)}
                  onDelete={() => console.log("Delete", followUp.id)}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="meetings" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Meeting Notes</h2>
            <Button data-testid="button-add-meeting">
              <Plus className="h-4 w-4 mr-2" />
              Add Meeting
            </Button>
          </div>
          <div className="space-y-4">
            {meetingNotes.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground text-center max-w-md">
                    No meeting notes yet. Document meetings with students or parents here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              meetingNotes.map((note) => (
                <MeetingNoteCard
                  key={note.id}
                  id={note.id}
                  date={format(new Date(note.date), "MMMM d, yyyy")}
                  participants={note.participants}
                  summary={note.summary}
                  fullNotes={note.fullNotes ?? ""}
                  onEdit={() => console.log("Edit meeting", note.id)}
                  onDelete={() => console.log("Delete meeting", note.id)}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AddBehaviorLogDialog
        open={isAddLogDialogOpen}
        onOpenChange={setIsAddLogDialogOpen}
        onSubmit={(data) => console.log("New log:", data)}
      />

      <BehaviorLogDetailsSheet
        open={isLogDetailsOpen}
        onOpenChange={setIsLogDetailsOpen}
        log={selectedLog}
        onUpdateNotes={handleUpdateNotes}
        onUpdateStrategies={handleUpdateStrategies}
        onDelete={handleDeleteLog}
      />
    </div>
  );
}
