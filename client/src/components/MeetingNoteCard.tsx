import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Calendar, Users, Edit, Trash2 } from "lucide-react";

interface MeetingNoteCardProps {
  id: string;
  date: string;
  participants: string[];
  summary: string;
  fullNotes: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MeetingNoteCard({
  id,
  date,
  participants,
  summary,
  fullNotes,
  onEdit,
  onDelete,
}: MeetingNoteCardProps) {
  return (
    <Card data-testid={`card-meeting-${id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="flex-1">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {date}
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <Users className="h-3 w-3 text-muted-foreground" />
            <div className="flex gap-1 flex-wrap">
              {participants.map((participant, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {participant}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onEdit}
            data-testid={`button-edit-meeting-${id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onDelete}
            data-testid={`button-delete-meeting-${id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible>
          <AccordionItem value="details" className="border-0">
            <div className="mb-2">
              <p className="text-sm font-medium mb-1">Summary</p>
              <p className="text-sm text-muted-foreground" data-testid={`text-summary-${id}`}>
                {summary}
              </p>
            </div>
            <AccordionTrigger className="text-sm py-2 hover-elevate px-2 -mx-2 rounded-md">
              View Full Notes
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm whitespace-pre-wrap mt-2" data-testid={`text-full-notes-${id}`}>
                {fullNotes}
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
