import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/context/DataContext';
import RoleBadge from '@/components/shared/RoleBadge';
import { Shield, Users, AlertTriangle, Clock } from 'lucide-react';

export default function RepoSidebar({ repo }) {
  const { users, repoAccess } = useData();

  const accessList = repoAccess.filter(a => a.repoId === repo.id);
  const owner = users.find(u => u.id === repo.owner);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-3">Repository Info</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">Sensitivity</span>
            {repo.is_sensitive ? (
              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px] font-mono">
                <AlertTriangle className="w-3 h-3 mr-1" />
                SENSITIVE
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono">
                PUBLIC
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">Owner</span>
            <span className="font-mono text-xs text-foreground">{owner?.username || 'Unknown'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">Last Activity</span>
            <span className="font-mono text-xs text-foreground">{repo.lastActivity}</span>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
          <Users className="w-3 h-3" /> Access List
        </p>
        <div className="space-y-2">
          {owner && (
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-mono font-bold text-secondary-foreground">
                  {owner.avatar}
                </div>
                <span className="font-mono text-xs text-foreground">{owner.username}</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border-amber-500/30">owner</Badge>
            </div>
          )}
          {accessList.map(access => {
            const user = users.find(u => u.id === access.userId);
            if (!user) return null;
            return (
              <div key={access.userId} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-mono font-bold text-secondary-foreground">
                    {user.avatar}
                  </div>
                  <span className="font-mono text-xs text-foreground">{user.username}</span>
                </div>
                <RoleBadge role={access.role} />
              </div>
            );
          })}
          {accessList.length === 0 && !owner && (
            <p className="text-xs font-mono text-muted-foreground">No access configured</p>
          )}
        </div>
      </div>
    </div>
  );
}