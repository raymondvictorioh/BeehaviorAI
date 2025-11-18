import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Mail, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InvitationDetails {
  valid: boolean;
  email: string;
  organizationName: string;
  role: string;
  inviterName?: string;
  expiresAt: string;
}

export default function AcceptInvitation() {
  const { token } = useParams<{ token: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [autoAccepting, setAutoAccepting] = useState(false);

  // Check if we should auto-accept (user just signed up/logged in)
  const searchParams = new URLSearchParams(window.location.search);
  const shouldAutoAccept = searchParams.get("auto") === "true";

  // Validate invitation token
  const {
    data: invitation,
    isLoading: isValidating,
    error: validationError,
  } = useQuery<InvitationDetails>({
    queryKey: ["/api/invitations/validate", token],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/invitations/validate/${token}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Invalid invitation");
      }
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  // Accept invitation mutation
  const acceptInvitation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/invitations/${token}/accept`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to accept invitation");
      }
      return res.json();
    },
    onSuccess: async (data) => {
      // Invalidate user query to refresh authentication state
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      toast({
        title: "Invitation accepted!",
        description: `Welcome to ${invitation?.organizationName}!`,
      });

      // Redirect to dashboard
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to accept invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto-accept if user just signed up/logged in
  useEffect(() => {
    if (shouldAutoAccept && isAuthenticated && invitation?.valid && !autoAccepting) {
      setAutoAccepting(true);
      acceptInvitation.mutate();
    }
  }, [shouldAutoAccept, isAuthenticated, invitation?.valid]);

  // Loading state
  if (isValidating) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Validating invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state - Invalid or expired invitation
  if (validationError || !invitation?.valid) {
    const errorMessage = validationError?.message || "This invitation link is invalid or has expired";

    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Invalid Invitation</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The invitation link may have expired or already been used. Please contact the person who invited you for a new invitation.
              </AlertDescription>
            </Alert>
            <Button onClick={() => navigate("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Email mismatch - User logged in with different email
  if (isAuthenticated && user && user.email !== invitation.email) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
              <AlertCircle className="h-6 w-6 text-amber-500" />
            </div>
            <CardTitle className="text-2xl">Email Mismatch</CardTitle>
            <CardDescription>
              This invitation was sent to <strong>{invitation.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You're currently logged in as <strong>{user.email}</strong>. Please log out and sign up with the invited email address.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Button
                onClick={() => {
                  // Log out and redirect to signup with invitation
                  apiRequest("POST", "/api/auth/logout").then(() => {
                    navigate(`/signup?invitation=${token}`);
                  });
                }}
                className="w-full"
              >
                Log Out & Sign Up
              </Button>
              <Button variant="outline" onClick={() => navigate("/")} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User not authenticated - Show signup/login options
  if (!isAuthenticated) {
    const expiresAt = new Date(invitation.expiresAt);
    const formattedExpiry = expiresAt.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">You've been invited!</CardTitle>
            <CardDescription>
              Join {invitation.organizationName} on BeehaviorAI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Organization:</span>
                <span className="font-medium">{invitation.organizationName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Role:</span>
                <span className="font-medium capitalize">{invitation.role}</span>
              </div>
              {invitation.inviterName && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Invited by:</span>
                  <span className="font-medium">{invitation.inviterName}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{invitation.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expires:</span>
                <span className="font-medium text-xs">{formattedExpiry}</span>
              </div>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Create an account with <strong>{invitation.email}</strong> to accept this invitation.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button
                onClick={() => navigate(`/signup?invitation=${token}`)}
                className="w-full"
              >
                Sign Up to Accept
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/login?invitation=${token}`)}
                className="w-full"
              >
                Already have an account? Log In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated and email matches - Show accept button
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Accept Invitation</CardTitle>
          <CardDescription>
            Join {invitation.organizationName} as a {invitation.role}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Organization:</span>
              <span className="font-medium">{invitation.organizationName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Role:</span>
              <span className="font-medium capitalize">{invitation.role}</span>
            </div>
            {invitation.inviterName && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invited by:</span>
                <span className="font-medium">{invitation.inviterName}</span>
              </div>
            )}
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              You'll be added to this organization and can start collaborating immediately.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button
              onClick={() => acceptInvitation.mutate()}
              disabled={acceptInvitation.isPending || autoAccepting}
              className="w-full"
            >
              {acceptInvitation.isPending || autoAccepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                "Accept Invitation"
              )}
            </Button>
            <Button variant="outline" onClick={() => navigate("/")} className="w-full">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
