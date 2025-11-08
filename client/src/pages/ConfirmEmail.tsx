import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { School, Mail, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ConfirmEmail() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);

  // Get email from URL params
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email") || "";

  const handleResendEmail = async () => {
    if (!email) {
      toast({
        title: "Email address missing",
        description: "Unable to resend confirmation email",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsResending(true);
      const response = await apiRequest("POST", "/api/auth/resend-confirmation", { email });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to resend email");
      }

      toast({
        title: "Email sent!",
        description: "Please check your inbox for the confirmation email.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to resend email",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <School className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Please check your inbox to confirm your email address</CardTitle>
          <CardDescription className="flex items-center justify-center gap-2 mt-2">
            <Mail className="h-4 w-4" />
            We sent a confirmation email to{" "}
            <span className="font-medium text-primary" data-testid="text-email">
              {email}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-muted bg-muted/50 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-medium">Didn't receive an email?</p>
                <p className="text-muted-foreground">
                  If you can't find the email in your inbox or spam folder, please click the button
                  below and we will send you a new one. If you don't receive a confirmation email,
                  please contact support at{" "}
                  <a href="mailto:support@beehave.com" className="text-primary hover:underline">
                    support@beehave.com
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleResendEmail}
            variant="outline"
            className="w-full"
            disabled={isResending || !email}
            data-testid="button-resend-email"
          >
            {isResending ? "Sending..." : "Resend Email"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>This is a required step to publishing content on Beehave.</p>
          </div>

          <div className="pt-4 border-t text-center text-sm">
            <button
              type="button"
              className="text-primary underline-offset-4 hover:underline"
              onClick={() => navigate("/login")}
              data-testid="link-back-to-login"
            >
              Back to login
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
