import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, KeyRound, FolderGit2 } from 'lucide-react';
import UsersTab from '@/components/admin/UsersTab';
import RepoAccessTab from '@/components/admin/RepoAccessTab';
import ReposTab from '@/components/admin/ReposTab';
import Unauthorized from '@/components/shared/Unauthorized';
import { motion } from 'framer-motion';
import { Roles, normalizeRole } from '@/utils/rbac';

export default function AdminPanel() {
  const { currentUser } = useAuth();

  if (normalizeRole(currentUser.role) !== Roles.Admin) return <Unauthorized />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-mono font-bold text-foreground">Admin Panel</h1>
        <p className="text-sm font-mono text-muted-foreground mt-1">Manage users, access, and repositories</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-secondary border border-border mb-4">
          <TabsTrigger value="users" className="font-mono text-xs gap-1.5 data-[state=active]:bg-accent">
            <Users className="w-3.5 h-3.5" />Users
          </TabsTrigger>
          <TabsTrigger value="access" className="font-mono text-xs gap-1.5 data-[state=active]:bg-accent">
            <KeyRound className="w-3.5 h-3.5" />Repository Access
          </TabsTrigger>
          <TabsTrigger value="repos" className="font-mono text-xs gap-1.5 data-[state=active]:bg-accent">
            <FolderGit2 className="w-3.5 h-3.5" />Repositories
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="access"><RepoAccessTab /></TabsContent>
        <TabsContent value="repos"><ReposTab /></TabsContent>
      </Tabs>
    </motion.div>
  );
}