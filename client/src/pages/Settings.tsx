import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Users, Bell } from "lucide-react";

export default function Settings() {
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

      <Card data-testid="card-school-info">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            School Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="school-name">School Name</Label>
            <Input
              id="school-name"
              defaultValue="Lincoln High School"
              data-testid="input-school-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="school-email">School Email</Label>
            <Input
              id="school-email"
              type="email"
              defaultValue="admin@lincolnhigh.edu"
              data-testid="input-school-email"
            />
          </div>
          <Button data-testid="button-save-school-info">Save Changes</Button>
        </CardContent>
      </Card>

      <Card data-testid="card-admin-management">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Admin Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Manage admin users who can access the behavior management system.
          </p>
          <Button data-testid="button-manage-admins">Manage Admins</Button>
        </CardContent>
      </Card>

      <Card data-testid="card-notifications">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Configure email notifications for behavior logs and follow-ups.
          </p>
          <Button variant="outline" data-testid="button-configure-notifications">
            Configure Notifications
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
