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
import { ArrowLeft, Plus, Mail, GraduationCap, User } from "lucide-react";
import { useLocation } from "wouter";

export default function StudentProfile() {
  const [, setLocation] = useLocation();
  const [isAddLogDialogOpen, setIsAddLogDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isLogDetailsOpen, setIsLogDetailsOpen] = useState(false);

  // todo: remove mock functionality
  const student = {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@school.edu",
    class: "Grade 10A",
    gender: "Female",
  };

  const [behaviorLogs, setBehaviorLogs] = useState([
    {
      id: "1",
      incidentDate: "October 28, 2025",
      category: "Positive",
      notes: "Helped a classmate understand a difficult math concept during group work. Demonstrated excellent peer leadership and patience while explaining the material.",
      strategies: "Continue to encourage peer mentoring opportunities. Consider recommending for student ambassador program.",
      loggedBy: "Mr. Smith",
      loggedAt: "October 28, 2025 at 2:15 PM",
    },
    {
      id: "2",
      incidentDate: "October 25, 2025",
      category: "Concern",
      notes: "Late to class for the third time this week. Spoke with student about punctuality and its impact on learning.",
      strategies: "Follow up with parent meeting scheduled for next week. Monitor attendance closely. Check if there are any transportation issues.",
      loggedBy: "Mrs. Davis",
      loggedAt: "October 25, 2025 at 9:30 AM",
    },
    {
      id: "3",
      incidentDate: "October 22, 2025",
      category: "Positive",
      notes: "Excellent presentation on environmental science project. Showed strong research skills and effective communication.",
      strategies: "",
      loggedBy: "Dr. Martinez",
      loggedAt: "October 22, 2025 at 1:45 PM",
    },
    {
      id: "4",
      incidentDate: "October 20, 2025",
      category: "Neutral",
      notes: "Student requested extra time on assignment due to family circumstances. Extension granted until Friday.",
      strategies: "Check in on Friday to ensure assignment is completed. Offer additional support if needed.",
      loggedBy: "Mr. Smith",
      loggedAt: "October 20, 2025 at 11:20 AM",
    },
  ]);

  const meetingNotes = [
    {
      id: "1",
      date: "October 25, 2025",
      participants: ["Mrs. Johnson (Parent)", "Mr. Smith (Teacher)"],
      summary: "Discussed Sarah's recent tardiness and academic progress. Parent committed to ensuring better morning routine.",
      fullNotes: "Meeting started at 3:00 PM. Mrs. Johnson was concerned about recent behavior changes. We discussed Sarah's academic performance, which remains strong. The tardiness issue was addressed, and Mrs. Johnson explained there have been some family circumstances affecting morning routines. We agreed on a plan to improve punctuality with check-ins every two weeks.",
    },
  ];

  const followUps = [
    {
      id: "1",
      title: "Check in with Sarah about morning routine progress",
      dueDate: "November 8, 2025",
      priority: "medium" as const,
      completed: false,
    },
    {
      id: "2",
      title: "Review academic performance in math class",
      dueDate: "November 15, 2025",
      priority: "low" as const,
      completed: false,
    },
  ];

  const handleViewLog = (log: any) => {
    setSelectedLog(log);
    setIsLogDetailsOpen(true);
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    setBehaviorLogs(logs =>
      logs.map(log =>
        log.id === id ? { ...log, notes } : log
      )
    );
    if (selectedLog?.id === id) {
      setSelectedLog({ ...selectedLog, notes });
    }
  };

  const handleUpdateStrategies = (id: string, strategies: string) => {
    setBehaviorLogs(logs =>
      logs.map(log =>
        log.id === id ? { ...log, strategies } : log
      )
    );
    if (selectedLog?.id === id) {
      setSelectedLog({ ...selectedLog, strategies });
    }
  };

  const handleDeleteLog = (id: string) => {
    setBehaviorLogs(logs => logs.filter(log => log.id !== id));
  };

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
              <AvatarFallback className="text-2xl">SJ</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-semibold mb-4" data-testid="text-student-name">
                {student.name}
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm" data-testid="text-student-email">{student.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm" data-testid="text-student-class">{student.class}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm" data-testid="text-student-gender">{student.gender}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AISummaryCard
        summary="Sarah is generally a well-behaved and engaged student who actively participates in class. Recent behavior logs indicate strong leadership qualities and helpful nature towards peers. There have been a few minor concerns about tardiness to morning classes, which may need attention. Overall academic performance remains strong with particular excellence in science subjects."
        lastUpdated="October 28, 2025 at 2:30 PM"
        onRegenerate={() => console.log("Regenerating summary")}
      />

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
            {behaviorLogs.map((log) => (
              <BehaviorLogEntry
                key={log.id}
                id={log.id}
                date={log.incidentDate}
                category={log.category}
                notes={log.notes}
                onView={() => handleViewLog(log)}
              />
            ))}
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
            {followUps.map((followUp) => (
              <FollowUpItem
                key={followUp.id}
                {...followUp}
                onToggle={() => console.log("Toggle", followUp.id)}
                onEdit={() => console.log("Edit", followUp.id)}
                onDelete={() => console.log("Delete", followUp.id)}
              />
            ))}
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
            {meetingNotes.map((note) => (
              <MeetingNoteCard
                key={note.id}
                {...note}
                onEdit={() => console.log("Edit meeting", note.id)}
                onDelete={() => console.log("Delete meeting", note.id)}
              />
            ))}
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
