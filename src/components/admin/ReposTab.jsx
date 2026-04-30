import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ReposTab() {
  const { repos, users, toggleSensitivity, deleteRepo } = useData();
  const { toast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleDelete = () => {
    if (deleteTarget) {
      deleteRepo(deleteTarget.id);
      toast({ title: "Repository deleted", description: `${deleteTarget.name} has been removed` });
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 border-border">
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Repository</TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Owner</TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Sensitive</TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {repos.map(repo => {
              const owner = users.find(u => u.id === repo.owner);
              return (
                <TableRow key={repo.id} className="border-border">
                  <TableCell>
                    <div>
                      <span className="font-mono text-sm text-foreground">{repo.name}</span>
                      <p className="font-mono text-[10px] text-muted-foreground">{repo.description}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{owner?.username}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={repo.is_sensitive}
                        onCheckedChange={() => {
                          toggleSensitivity(repo.id);
                          toast({ title: "Sensitivity updated", description: `${repo.name} sensitivity toggled` });
                        }}
                      />
                      {repo.is_sensitive && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(repo)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 font-mono text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-foreground">Delete Repository?</AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-sm text-muted-foreground">
              This will permanently delete <strong>{deleteTarget?.name}</strong> and revoke all access. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground font-mono text-xs hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}