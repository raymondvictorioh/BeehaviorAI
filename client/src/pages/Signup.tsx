import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { School, Mail, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

interface InvitationDetails {
  valid: boolean;
  email: string;
  organizationName: string;
  role: string;
  inviterName?: string;
}

export default function Signup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Check for invitation parameter
  const searchParams = new URLSearchParams(window.location.search);
  const invitationToken = searchParams.get("invitation");

  // Validate invitation token if present
  const { data: invitation, isLoading: isValidatingInvitation } = useQuery<InvitationDetails>({
    queryKey: ["/api/invitations/validate", invitationToken],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/invitations/validate/${invitationToken}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Invalid invitation");
      }
      return res.json();
    },
    enabled: !!invitationToken,
    retry: false,
  });

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Pre-fill email from invitation
  useEffect(() => {
    if (invitation?.valid && invitation.email) {
      form.setValue("email", invitation.email);
    }
  }, [invitation, form]);

  const onSubmit = async (data: SignupForm) => {
    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/auth/signup", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to sign up");
      }

      const result = await response.json();

      // Check if email confirmation is required
      if (result.requiresEmailConfirmation) {
        navigate(`/confirm-email?email=${encodeURIComponent(data.email)}`);
        return;
      }

      // Invalidate user query to refresh authentication state
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      // If signing up with invitation, redirect to accept invitation page
      if (invitationToken) {
        toast({
          title: "Account created!",
          description: `Accepting invitation to ${invitation?.organizationName}...`,
        });
        navigate(`/accept-invitation/${invitationToken}?auto=true`);
        return;
      }

      // Regular signup flow - redirect to onboarding
      toast({
        title: "Account created!",
        description: "Welcome to Beehave. Let's set up your school.",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while validating invitation
  if (isValidatingInvitation) {
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

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            {invitation ? <Mail className="h-6 w-6 text-primary" /> : <School className="h-6 w-6 text-primary" />}
          </div>
          <CardTitle className="text-2xl">
            {invitation ? `Join ${invitation.organizationName}` : "Create your account"}
          </CardTitle>
          <CardDescription>
            {invitation
              ? `Sign up to accept your invitation as ${invitation.role}`
              : "Get started with Beehave today"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitation && (
            <Alert className="mb-4">
              <Mail className="h-4 w-4" />
              <AlertDescription>
                You've been invited by <strong>{invitation.inviterName || "a team member"}</strong> to join{" "}
                <strong>{invitation.organizationName}</strong> as a <strong>{invitation.role}</strong>.
              </AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="John"
                          autoComplete="given-name"
                          data-testid="input-first-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Doe"
                          autoComplete="family-name"
                          data-testid="input-last-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="your@email.com"
                        autoComplete="email"
                        data-testid="input-email"
                        readOnly={!!invitation}
                        disabled={!!invitation}
                        className={invitation ? "bg-muted cursor-not-allowed" : ""}
                      />
                    </FormControl>
                    {invitation && (
                      <p className="text-xs text-muted-foreground">
                        Email is pre-filled from your invitation
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        data-testid="input-confirm-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-signup"
              >
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                className="text-primary underline-offset-4 hover:underline"
                onClick={() => navigate("/login")}
                data-testid="link-login"
              >
                Sign in
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
