import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Bell, FileText, Plus, Trash2, Edit } from "lucide-react";

export default function Settings() {
  // Mock state for behavior categories
  const [categories] = useState([
    { id: "1", name: "Positive", color: "bg-green-500", description: "Positive behavior and achievements" },
    { id: "2", name: "Neutral", color: "bg-blue-500", description: "General observations and notes" },
    { id: "3", name: "Concern", color: "bg-amber-500", description: "Minor concerns requiring attention" },
    { id: "4", name: "Serious", color: "bg-red-500", description: "Serious incidents requiring immediate action" },
  ]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2" data-testid="text-page-title">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Configure your school's preferences and settings
        </p>
      </div>

      <Tabs defaultValue="organization" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="organization" data-testid="tab-organization">
            <Building2 className="h-4 w-4 mr-2" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="logs" data-testid="tab-logs">
            <FileText className="h-4 w-4 mr-2" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="mt-6 space-y-6">
          <Card data-testid="card-organization-details">
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Update your school's basic information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="school-name">School Name</Label>
                  <Input
                    id="school-name"
                    defaultValue="Lincoln High School"
                    data-testid="input-school-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school-code">School Code</Label>
                  <Input
                    id="school-code"
                    defaultValue="LHS-2024"
                    data-testid="input-school-code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="school-email">School Email</Label>
                  <Input
                    id="school-email"
                    type="email"
                    defaultValue="admin@lincolnhigh.edu"
                    data-testid="input-school-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school-phone">School Phone</Label>
                  <Input
                    id="school-phone"
                    type="tel"
                    defaultValue="(555) 123-4567"
                    data-testid="input-school-phone"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="school-address">Address</Label>
                <Input
                  id="school-address"
                  defaultValue="123 Education Lane, Learning City, ST 12345"
                  data-testid="input-school-address"
                />
              </div>

              <Button data-testid="button-save-organization">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6 space-y-6">
          <Card data-testid="card-user-management">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage admin users and teachers who can access the system
                  </CardDescription>
                </div>
                <Button data-testid="button-add-user">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">John Smith</p>
                    <p className="text-sm text-muted-foreground">john.smith@lincolnhigh.edu</p>
                    <Badge variant="secondary" className="mt-1">Administrator</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" data-testid="button-edit-user-1">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" data-testid="button-delete-user-1">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sarah Johnson</p>
                    <p className="text-sm text-muted-foreground">sarah.johnson@lincolnhigh.edu</p>
                    <Badge variant="secondary" className="mt-1">Teacher</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" data-testid="button-edit-user-2">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" data-testid="button-delete-user-2">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card data-testid="card-notification-settings">
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure email notifications for behavior logs and follow-ups
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-new-log">New Behavior Log</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications when a new behavior log is created
                  </p>
                </div>
                <Switch id="notify-new-log" defaultChecked data-testid="switch-notify-new-log" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-serious">Serious Incidents</Label>
                  <p className="text-sm text-muted-foreground">
                    Get immediate alerts for serious behavior incidents
                  </p>
                </div>
                <Switch id="notify-serious" defaultChecked data-testid="switch-notify-serious" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-followup">Follow-up Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive reminders for upcoming follow-up tasks
                  </p>
                </div>
                <Switch id="notify-followup" defaultChecked data-testid="switch-notify-followup" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-meeting">Meeting Notes</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new meeting notes are added
                  </p>
                </div>
                <Switch id="notify-meeting" data-testid="switch-notify-meeting" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-weekly">Weekly Summary</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a weekly summary of behavior activities
                  </p>
                </div>
                <Switch id="notify-weekly" defaultChecked data-testid="switch-notify-weekly" />
              </div>

              <Button data-testid="button-save-notifications">Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-6 space-y-6">
          <Card data-testid="card-log-categories">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Behavior Log Categories</CardTitle>
                  <CardDescription>
                    Manage the categories used for classifying behavior logs
                  </CardDescription>
                </div>
                <Button data-testid="button-add-category">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.map((category, index) => (
                  <div
                    key={category.id}
                    className="border rounded-lg p-4 flex items-center gap-4"
                    data-testid={`category-item-${index}`}
                  >
                    <div className={`h-8 w-8 rounded-md ${category.color} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" data-testid={`button-edit-category-${index}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-category-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
