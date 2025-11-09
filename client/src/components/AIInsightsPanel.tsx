import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Target, AlertCircle } from "lucide-react";
import { useState } from "react";

interface AIInsightsPanelProps {
  studentName?: string;
}

export function AIInsightsPanel({ studentName = "this student" }: AIInsightsPanelProps) {
  const [showInsights, setShowInsights] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleUncoverInsights = () => {
    setIsGenerating(true);
    // Simulate AI processing
    setTimeout(() => {
      setIsGenerating(false);
      setShowInsights(true);
    }, 1500);
  };

  return (
    <Card className="h-fit" data-testid="card-ai-insights">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-amber-500" />
          Want help understanding this student through their data?
          </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showInsights ? (
          <>
         
            <p className="text-sm text-muted-foreground">
              Get AI-powered insights about this student's behavior patterns and academic performance.
            </p>
            <Button
              onClick={handleUncoverInsights}
              className="w-full"
              disabled={isGenerating}
              data-testid="button-uncover-insights"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Uncover Insights
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-medium text-sm">Positive Trends</h4>
                  <p className="text-sm text-muted-foreground">
                    Showing consistent improvement in collaboration and group work participation over the past 3 weeks.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-medium text-sm">Key Strengths</h4>
                  <p className="text-sm text-muted-foreground">
                    Demonstrates excellent time management skills with consistent on-time homework completion.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/20">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-medium text-sm">Areas to Monitor</h4>
                  <p className="text-sm text-muted-foreground">
                    Consider providing additional support during independent work sessions to maintain engagement.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <h4 className="font-medium text-sm">Recommended Actions</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Continue positive reinforcement for collaborative behaviors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Schedule a check-in meeting to discuss independent work strategies</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Consider peer mentoring opportunities to leverage their strengths</span>
                </li>
              </ul>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowInsights(false)}
              data-testid="button-refresh-insights"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Refresh Insights
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
