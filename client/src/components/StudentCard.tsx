import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface StudentCardProps {
  id: string;
  name: string;
  email: string;
  class: string;
  gender: string;
  logsCount: number;
  lastActivity?: string;
  avatarUrl?: string;
  onClick?: () => void;
}

export function StudentCard({
  id,
  name,
  email,
  class: className,
  logsCount,
  lastActivity,
  avatarUrl,
  onClick,
}: StudentCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card
      className="hover-elevate cursor-pointer"
      onClick={onClick}
      data-testid={`card-student-${id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-lg truncate" data-testid={`text-student-name-${id}`}>
              {name}
            </h3>
            <p className="text-sm text-muted-foreground truncate">{email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs" data-testid={`badge-class-${id}`}>
                {className || "N.A"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {logsCount} {logsCount === 1 ? "log" : "logs"}
              </span>
            </div>
            {lastActivity && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{lastActivity}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
