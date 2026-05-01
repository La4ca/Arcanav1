import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import StatCards from '@/components/dashboard/StatCards';
import RepoCard from '@/components/dashboard/RepoCard';
import AddRepoDialog from '@/components/dashboard/AddRepoDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Roles, hasRoleAtLeast, normalizeRole } from '@/utils/rbac';

export default function Dashboard() {
  const { repos, repoAccess } = useData();
  const { currentUser } = useAuth();
  const [showAddRepo, setShowAddRepo] = useState(false);

  const role = normalizeRole(currentUser.role);
  const canAddRepo = hasRoleAtLeast(role, Roles.Write);
  const isAdmin = role === Roles.Admin;

  const myAccessRepoIds = new Set(
    repoAccess.filter(a => a.userId === currentUser.id).map(a => a.repoId)
  );
  const visibleRepos = isAdmin
    ? repos
    : repos.filter(r => r.owner === currentUser.id || myAccessRepoIds.has(r.id));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">System overview and repositories</p>
      </div>

      <StatCards />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif font-semibold text-foreground">Repositories</h2>
          {canAddRepo && (
            <Button size="sm" onClick={() => setShowAddRepo(true)}
              className="text-xs bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-3.5 h-3.5 mr-1" /> New Repo
            </Button>
          )}
        </div>
        {visibleRepos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 rounded-lg border border-dashed border-border text-muted-foreground">
            <p className="font-mono text-sm">No repositories yet</p>
            <p className="font-mono text-xs opacity-60">You'll see repositories here once an admin invites you.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleRepos.map(repo => <RepoCard key={repo.id} repo={repo} />)}
          </div>
        )}
      </div>

      <AddRepoDialog open={showAddRepo} onClose={() => setShowAddRepo(false)} />
    </motion.div>
  );
}
