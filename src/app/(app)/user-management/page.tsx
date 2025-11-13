
"use client";

import React from "react";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, Settings, UserCog } from "lucide-react";
import { ProfileTab } from "./profile-tab";
import { UserManagementTab } from "./user-management-tab";
import { SettingsTab } from "./settings-tab";
import { SecurityTab } from "./security-tab";
import { useUser } from "@/firebase";
import { useUsers } from "@/hooks/use-users";

export default function UserManagementPage() {
  const { user } = useUser();
  const { users } = useUsers();
  const [userRole, setUserRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user && users.length > 0) {
      const currentUserProfile = users.find(u => u.id === user.uid);
      if (currentUserProfile) {
        setUserRole(currentUserProfile.role);
      }
    }
  }, [user, users]);

  const isAdministrator = userRole === 'Administrator' || userRole === 'Super Administrator';
  
  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings & Users"
        description="Manage your profile, settings, and user accounts"
      />
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-1 h-auto sm:w-auto sm:inline-flex sm:h-10">
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          {isAdministrator && (
            <TabsTrigger value="user-management">
              <UserCog className="mr-2 h-4 w-4" />
              Manage Users
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="profile">
            <ProfileTab />
        </TabsContent>
        <TabsContent value="settings">
            <SettingsTab />
        </TabsContent>
        <TabsContent value="security">
            <SecurityTab />
        </TabsContent>
        {isAdministrator && (
            <TabsContent value="user-management">
                <UserManagementTab />
            </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

    