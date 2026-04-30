import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import RoleBadge from '@/components/shared/RoleBadge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, UserMinus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Roles, normalizeRole } from '@/utils/rbac';

export default function RepoAccessTab() {
  const { repos, users, repoAccess, grantAccess, revokeAccess } = useData();
  const { toast } = useToast();
  const [selectedRepo, setSelectedRepo] = useState(repos[0]?.id || '');
  const [grantUserId, setGrantUserId] = useState('');
  const [grantRole, setGrantRole] = useState(Roles.Read);

  const accessForRepo = repoAccess.filter(a => a.repoId === selectedRepo);
  const repo = repos.find(r => r.id === selectedRepo);
  const usersWithAccess = accessForRepo.map(a => ({
    ...a,
    user: users.find(u => u.id === a.userId),
  }));

  const usersWithoutAccess = users.filter(u =>
    u.id !== repo?.owner && !accessForRepo.some(a => a.userId === u.id)
  );

  const handleGrant = () => {
    if (!grantUserId) return;
    grantAccess(grantUserId, selectedRepo, normalizeRole(grantRole));
    const user = users.find(u => u.id === grantUserId);
    toast({ title: "Access granted", description: `${user?.username} now has ${grantRole} access` });
    setGrantUserId('');
  };

  const handleRevoke = (userId) => {
    revokeAccess(userId, selectedRepo);
    const user = users.find(u => u.id === userId);
    toast({ title: "Access revoked", description: `${user?.username}'s access has been removed` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select value={selectedRepo} onValueChange={setSelectedRepo}>
          <SelectTrigger className="w-64 font-mono text-xs bg-secondary border-border">
            <SelectValue placeholder="Select repository" />
          </SelectTrigger>
          <SelectContent>
            {repos.map(r => (
              <SelectItem key={r.id} value={r.id} className="font-mono text-xs">{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grant access */}
      <div className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border">
        <Select value={grantUserId} onValueChange={setGrantUserId}>
          <SelectTrigger className="w-48 font-mono text-xs bg-secondary border-border h-8">
            <SelectValue placeholder="Select user..." />
          </SelectTrigger>
          <SelectContent>
            {usersWithoutAccess.map(u => (
              <SelectItem key={u.id} value={u.id} className="font-mono text-xs">{u.username}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={grantRole} onValueChange={setGrantRole}>
          <SelectTrigger className="w-36 font-mono text-xs bg-secondary border-border h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={Roles.Read} className="font-mono text-xs">View</SelectItem>
            <SelectItem value={Roles.Triage} className="font-mono text-xs">Triage</SelectItem>
            <SelectItem value={Roles.Write} className="font-mono text-xs">Write</SelectItem>
            <SelectItem value={Roles.Maintainer} className="font-mono text-xs">Maintainer</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={handleGrant} className="font-mono text-xs bg-primary text-primary-foreground" disabled={!grantUserId}>
          <UserPlus className="w-3.5 h-3.5 mr-1" /> Grant
        </Button>
      </div>

      {/* Access table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 border-border">
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">User</TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Role</TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersWithAccess.map(({ userId, role, user }) => (
              <TableRow key={userId} className="border-border">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-mono font-bold text-secondary-foreground">
                      {user?.avatar}
                    </div>
                    <span className="font-mono text-sm text-foreground">{user?.username}</span>
                  </div>
                </TableCell>
                <TableCell><RoleBadge role={role} /></TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => handleRevoke(userId)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 font-mono text-xs">
                    <UserMinus className="w-3.5 h-3.5 mr-1" /> Revoke
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {usersWithAccess.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center font-mono text-xs text-muted-foreground py-6">
                  No users have explicit access to this repository
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}