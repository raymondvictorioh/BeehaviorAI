import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Users, FileText, TrendingUp, Sparkles } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Beehave</h1>
          </div>
          <Button onClick={handleLogin} size="lg" data-testid="button-login">
            Log In
          </Button>
        </header>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6">
            Simplify Student Behavior Management
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Track behavior, generate AI-powered insights, and support student success
            with our comprehensive behavior management platform.
          </p>
          <Button onClick={handleLogin} size="lg" className="text-lg px-8 py-6" data-testid="button-get-started">
            Get Started Free
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Student Profiles</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive profiles with behavior history and insights
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Behavior Logs</h3>
              <p className="text-sm text-muted-foreground">
                Easy tracking of positive behaviors and areas of concern
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">AI Insights</h3>
              <p className="text-sm text-muted-foreground">
                Automated summaries and intelligent recommendations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Track trends and measure intervention effectiveness
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-semibold mb-4">
                Ready to Transform Your Approach to Behavior Management?
              </h3>
              <p className="text-muted-foreground mb-6">
                Join schools already using Beehave to support student success.
              </p>
              <Button onClick={handleLogin} size="lg" data-testid="button-cta">
                Start Your Free Trial
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
