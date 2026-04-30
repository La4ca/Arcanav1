import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import RoleBadge from '@/components/shared/RoleBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Roles } from '@/utils/rbac';
import { UserPlus, Trash2 } from 'lucide-react';

export default function UsersTab() {
  const { users, updateUserRole, addUser, removeUser } = useData();
  const { toast } = useToast();

  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState(Roles.Read);

  const handleRoleChange = (userId, newRole) => {
    updateUserRole(userId, newRole);
    toast({ title: 'Role updated', description: `User role changed to ${newRole}` });
  };

  const handleAddUser = () => {
    if (!newUsername.trim() || !newEmail.trim()) {
      toast({ title: 'Validation error', description: 'Username and email are required.', variant: 'destructive' });
      return;
    }
    if (users.some(u => u.username === newUsername.trim())) {
      toast({ title: 'Duplicate username', description: 'That username already exists.', variant: 'destructive' });
      return;
    }
    addUser({
      username: newUsername.trim(),
      email: newEmail.trim(),
      role: newRole,
      avatar: newUsername.trim()[0].toUpperCase(),
    });
    toast({ title: 'User created', description: `${newUsername} added with role ${newRole}.` });
    setNewUsername('');
    setNewEmail('');
    setNewRole(Roles.Read);
  };

  const handleRemove = (userId, username) => {
    removeUser(userId);
    toast({ title: 'User removed', description: `${username} has been deleted.` });
  };

  return (
    <div className="space-y-6">
      {/* Create User */}
      <div className="bg-card rounded-lg border border-border p-4 space-y-3">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Create New User</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] text-muted-foreground">USERNAME</label>
            <Input
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              placeholder="e.g. jsmith"
              className="font-mono text-xs bg-secondary border-border h-8 w-40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] text-muted-foreground">EMAIL</label>
            <Input
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="user@arcana.local"
              className="font-mono text-xs bg-secondary border-border h-8 w-52"
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] text-muted-foreground">ROLE</label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="w-36 font-mono text-xs bg-secondary border-border h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Roles.Admin} className="font-mono text-xs">Admin</SelectItem>
                <SelectItem value={Roles.Maintainer} className="font-mono text-xs">Maintainer</SelectItem>
                <SelectItem value={Roles.Write} className="font-mono text-xs">Developer</SelectItem>
                <SelectItem value={Roles.Triage} className="font-mono text-xs">Auditor</SelectItem>
                <SelectItem value={Roles.Read} className="font-mono text-xs">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleAddUser}
            size="sm"
            className="font-mono text-xs bg-primary text-primary-foreground h-8"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Add User
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 border-border">
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">User</TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Email</TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Role</TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Change Role</TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id} className="border-border">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-mono font-bold text-secondary-foreground">
                      {user.avatar}
                    </div>
                    <span className="font-mono text-sm text-foreground">{user.username}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{user.email}</TableCell>
                <TableCell><RoleBadge role={user.role} /></TableCell>
                <TableCell>
                  <Select value={user.role} onValueChange={val => handleRoleChange(user.id, val)}>
                    <SelectTrigger className="w-36 font-mono text-xs bg-secondary border-border h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Roles.Admin} className="font-mono text-xs">Admin</SelectItem>
                      <SelectItem value={Roles.Maintainer} className="font-mono text-xs">Maintainer</SelectItem>
                      <SelectItem value={Roles.Write} className="font-mono text-xs">Developer</SelectItem>
                      <SelectItem value={Roles.Triage} className="font-mono text-xs">Auditor</SelectItem>
                      <SelectItem value={Roles.Read} className="font-mono text-xs">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-red-400"
                    title="Delete user"
                    onClick={() => handleRemove(user.id, user.username)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
