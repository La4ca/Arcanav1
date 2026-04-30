import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, GitCommitHorizontal, Clock, FolderGit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Roles, normalizeRole } from '@/utils/rbac';

export default function RepoCard({ repo }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { repoAccess } = useData();
  const { toast } = useToast();

  const hasAccess = normalizeRole(currentUser.role) === Roles.Admin
    || repo.owner === currentUser.id
    || repoAccess.some(a => a.userId === currentUser.id && a.repoId === repo.id);

  const handleClick = () => {
    if (hasAccess) {
      navigate(`/repo/${repo.id}`);
    } else {
      toast({
        title: "Access Denied",
        description: `You don't have permission to access ${repo.name}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Card
      onClick={handleClick}
      className={`bg-card/95 border-border/70 cursor-pointer transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 ${!hasAccess ? 'opacity-60' : ''}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-primary" />
            <h3 className="font-mono font-bold text-foreground text-sm">{repo.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            {repo.is_sensitive ? (
              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30 text-[10px] font-medium px-1.5">
                SENSITIVE
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-medium px-1.5">
                PUBLIC
              </Badge>
            )}
            {!hasAccess && <Lock className="w-3.5 h-3.5 text-red-500" />}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">{repo.description}</p>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1">
            <GitCommitHorizontal className="w-3 h-3" />
            {repo.commits} commits
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {repo.lastActivity}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}