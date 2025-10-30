import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "lucide-react";
import { useState } from "react";

interface AISummaryCardProps {
  summary: string;
  lastUpdated: string;
  onRegenerate?: () => void;
}

export function AISummaryCard({ summary, lastUpdated, onRegenerate }: AISummaryCardProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = () => {
    setIsRegenerating(true);
    console.log("Regenerating AI summary");
    onRegenerate?.();
    setTimeout(() => setIsRegenerating(false), 1500);
  };

  return (
    <Card data-testid="card-ai-summary">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI-Generated Summary
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRegenerate}
          disabled={isRegenerating}
          data-testid="button-regenerate-summary"
        >
          <RefreshCw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-base leading-relaxed" data-testid="text-ai-summary">
          {summary}
        </p>
        <p className="text-xs text-muted-foreground" data-testid="text-last-updated">
          Last updated: {lastUpdated}
        </p>
      </CardContent>
    </Card>
  );
}
