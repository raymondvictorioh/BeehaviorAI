import { useState, useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AssistantSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssistantSheet({ open, onOpenChange }: AssistantSheetProps) {
  const [location] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Detect context based on current page
  const getContext = () => {
    if (location.startsWith("/students/")) {
      return {
        type: "student_profile",
        label: "Student Profile",
        description: "I have context about this student's behavior logs and profile",
      };
    } else if (location === "/students") {
      return {
        type: "students_list",
        label: "Students List",
        description: "I can help you manage and analyze student data",
      };
    } else if (location === "/reports") {
      return {
        type: "reports",
        label: "Reports",
        description: "I can help you understand and generate reports",
      };
    } else if (location === "/") {
      return {
        type: "dashboard",
        label: "Dashboard",
        description: "I can help you understand your school's behavior data",
      };
    }
    return {
      type: "general",
      label: "BehaviorHub",
      description: "I'm here to help with student behavior management",
    };
  };

  const context = getContext();

  // Suggested questions based on context
  const getSuggestedQuestions = () => {
    switch (context.type) {
      case "student_profile":
        return [
          "What patterns do you see in this student's behavior?",
          "What interventions would you recommend?",
          "Summarize this student's recent behavior",
          "How has this student's behavior changed over time?",
        ];
      case "students_list":
        return [
          "Which students need immediate attention?",
          "Show me students with positive behavior trends",
          "Which students have the most behavior logs?",
          "What are common behavior patterns across students?",
        ];
      case "reports":
        return [
          "What should I include in a behavior report?",
          "How do I identify behavior trends?",
          "What metrics are most important to track?",
          "Help me create a monthly behavior summary",
        ];
      case "dashboard":
        return [
          "What are the key behavior trends this month?",
          "Which classes need the most support?",
          "How can I improve overall student behavior?",
          "What patterns should I be aware of?",
        ];
      default:
        return [
          "How can I effectively manage student behavior?",
          "What are best practices for behavior tracking?",
          "Help me understand behavior patterns",
          "How do I create effective intervention strategies?",
        ];
    }
  };

  const suggestedQuestions = getSuggestedQuestions();

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context: {
            page: context.type,
            location,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-xl flex flex-col p-0"
        data-testid="sheet-assistant"
      >
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Assistant
          </SheetTitle>
          <SheetDescription>{context.description}</SheetDescription>
          <Badge variant="secondary" className="w-fit mt-2">
            <span className="text-xs">{context.label}</span>
          </Badge>
        </SheetHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    How can I help you today?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Ask me anything about student behavior management
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Suggested questions:
                  </p>
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3 px-4"
                      onClick={() => handleSuggestedQuestion(question)}
                      data-testid={`button-suggested-${index}`}
                    >
                      <span className="text-sm">{question}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                    data-testid={`message-${message.role}-${index}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="p-6 pt-4 border-t">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything..."
                className="min-h-[60px] resize-none"
                disabled={isLoading}
                data-testid="input-assistant-message"
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-[60px] w-[60px] flex-shrink-0"
                data-testid="button-send-message"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
