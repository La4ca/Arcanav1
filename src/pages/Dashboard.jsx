import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import StatCards from '@/components/dashboard/StatCards';
import RepoCard from '@/components/dashboard/RepoCard';
import AddRepoDialog from '@/components/dashboard/AddRepoDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Roles, hasRoleAtLeast, normalizeRole } from '@/utils/rbac';
import RoleBadge from '@/components/shared/RoleBadge';
import { showAutoToast } from '@/components/shared/AutoToast';

export default function Dashboard() {
  const { repos, repoInvites, repoAccess, users, acceptInvite, declineInvite, addLog } = useData();
  const { currentUser } = useAuth();
  const [showAddRepo, setShowAddRepo] = useState(false);

  const role = normalizeRole(currentUser.role);
  const canAddRepo = hasRoleAtLeast(role, Roles.Write);
  const isAdmin = role === Roles.Admin;

  // Only show repos the current user actually has access to:
  // Admin sees all. Others see only repos they own OR have a repoAccess entry for.
  const myAccessRepoIds = new Set(
    repoAccess.filter(a => a.userId === currentUser.id).map(a => a.repoId)
  );
  const visibleRepos = isAdmin
    ? repos
    : repos.filter(r => r.owner === currentUser.id || myAccessRepoIds.has(r.id));

  const myInvites = repoInvites.filter(i => i.inviteeId === currentUser.id && i.status === 'pending');
  const myInvitesWithMeta = myInvites.map(i => ({
    ...i,
    repo: repos.find(r => r.id === i.repoId),
    inviter: users.find(u => u.id === i.inviterId),
  }));

  const handleAccept = async (inv) => {
    await acceptInvite({ inviteId: inv.id, actorUserId: currentUser.id });
    await addLog({
      user: currentUser.username,
      action: 'INVITE_ACCEPTED',
      repo: inv.repoId,
      resource: inv.repo?.name ?? inv.repoId,
      ip: '127.0.0.1',
      meta: { invitedBy: inv.inviter?.username ?? inv.inviterId },
    });
    showAutoToast({ type: 'success', title: 'Invitation accepted', message: `You now have access to ${inv.repo?.name ?? inv.repoId}` });
  };

  const handleDecline = async (inv) => {
    await declineInvite({ inviteId: inv.id, actorUserId: currentUser.id });
    await addLog({
      user: currentUser.username,
      action: 'INVITE_DECLINED',
      repo: inv.repoId,
      resource: inv.repo?.name ?? inv.repoId,
      ip: '127.0.0.1',
      meta: {},
    });
    showAutoToast({ type: 'warning', title: 'Invitation declined', message: `Declined access to ${inv.repo?.name ?? inv.repoId}` });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">System overview and repositories</p>
      </div>

      {myInvitesWithMeta.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-serif font-semibold text-foreground">Invitations</h2>
            <p className="text-xs font-mono text-muted-foreground">{myInvitesWithMeta.length} pending</p>
          </div>
          <div className="space-y-2">
            {myInvitesWithMeta.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary/40 border border-border">
                <div className="min-w-0">
                  <p className="text-sm font-mono text-foreground truncate">{inv.repo?.name ?? inv.repoId}</p>
                  <p className="text-[11px] font-mono text-muted-foreground">Invited by {inv.inviter?.username ?? inv.inviterId}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <RoleBadge role={inv.role} />
                  <Button size="sm" variant="outline" className="font-mono text-xs" onClick={() => handleAccept(inv)}>
                    <Check className="w-3.5 h-3.5 mr-1" /> Accept
                  </Button>
                  <Button size="sm" variant="ghost" className="font-mono text-xs text-muted-foreground hover:text-foreground" onClick={() => handleDecline(inv)}>
                    <X className="w-3.5 h-3.5 mr-1" /> Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
