import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";

export default function Reports() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and download behavior reports"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover-elevate cursor-pointer" data-testid="card-report-student">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Student Behavior Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Generate comprehensive behavior reports for individual students including all logs, meetings, and AI summaries.
            </p>
            <Button variant="outline" className="w-full" data-testid="button-generate-student-report">
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer" data-testid="card-report-class">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Class Summary Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Generate summary reports for entire classes including behavior trends and statistics.
            </p>
            <Button variant="outline" className="w-full" data-testid="button-generate-class-report">
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
