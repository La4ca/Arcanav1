import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FolderGit2, KeyRound, GitCommitHorizontal, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Roles, normalizeRole } from '@/utils/rbac';

export default function StatCards() {
  const { currentUser } = useAuth();
  const { repos, repoAccess, commits, logs } = useData();

  const userAccess = normalizeRole(currentUser.role) === Roles.Admin
    ? repos.length
    : repoAccess.filter(a => a.userId === currentUser.id).length;

  const totalCommits = Object.values(commits).reduce((sum, arr) => sum + arr.length, 0);
  const alerts = logs.filter(l => l.action === 'ACCESS_DENIED').length;

  const stats = [
    { label: 'Total Repos', value: repos.length, icon: FolderGit2, color: 'text-primary' },
    { label: 'Your Access', value: userAccess, icon: KeyRound, color: 'text-blue-400' },
    { label: 'Total Commits', value: totalCommits, icon: GitCommitHorizontal, color: 'text-emerald-400' },
    { label: 'Alerts', value: alerts, icon: AlertTriangle, color: 'text-red-400' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(stat => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="bg-card/95 border-border/70">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-2xl font-semibold text-foreground">{stat.value}</span>
              </div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}